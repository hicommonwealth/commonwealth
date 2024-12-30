import { MAX_COMMENT_DEPTH } from '@hicommonwealth/shared';
import clsx from 'clsx';
import { GetThreadActionTooltipTextResponse } from 'helpers/threads';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import Thread from 'models/Thread';
import type { DeltaStatic } from 'quill';
import React, { useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';
import app from 'state';
import { useFetchCommentsQuery } from 'state/api/comments';
import useUserStore from 'state/ui/user';
import { CreateComment } from 'views/components/Comments/CreateComment';
import { WithActiveStickyComment } from 'views/components/StickEditorContainer/context/WithActiveStickyComment';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { notifyError } from '../../../../controllers/app/notifications';
import Permissions from '../../../../utils/Permissions';
import { CommentCard } from '../CommentCard';
import { CommentViewParams } from '../CommentCard/CommentCard';
import './CommentTree.scss';
import { CommentFilters } from './types';

type TreeHierarchyArgs = {
  pageRef: React.MutableRefObject<HTMLDivElement | null>;
  thread: Thread;
  parentCommentId?: number;
  isThreadLocked: boolean;
  isThreadArchived: boolean;
  isReplying: {
    toComment: number;
    parentCommentId?: number;
  };
  isReplyButtonVisible: boolean;
  disabledActionsTooltipText?: GetThreadActionTooltipTextResponse;
  canReply: boolean;
  canReact: boolean;
  canComment: boolean;
  onEditStart: (comment: CommentViewParams) => void;
  onEditConfirm: (comment: CommentViewParams, newDelta: DeltaStatic) => void;
  onEditCancel: (
    comment: CommentViewParams,
    hasContentChanged: boolean,
  ) => void;
  onDelete: (comment: CommentViewParams) => void;
  onSpamToggle: (comment: CommentViewParams) => void;
  onCommentReplyStart: (commentId: number, commentIndex: number) => void;
  onCommentReplyEnd: (isReplying: boolean, id?: number) => void;
  commentFilters: CommentFilters;
  commentEdits?: {
    [commentId: number]: {
      isEditing?: boolean;
      editDraft?: string;
      isSavingEdit?: boolean;
      contentDelta?: any;
    };
  };
};

export const TreeHierarchy = ({
  pageRef,
  thread,
  parentCommentId,
  isThreadLocked,
  isThreadArchived,
  isReplying,
  isReplyButtonVisible,
  disabledActionsTooltipText,
  canReply,
  canReact,
  canComment,
  onEditStart,
  onEditConfirm,
  onEditCancel,
  onDelete,
  onSpamToggle,
  onCommentReplyStart,
  onCommentReplyEnd,
  commentFilters,
  commentEdits,
}: TreeHierarchyArgs) => {
  const user = useUserStore();
  const communityId = app.activeChainId() || '';

  const {
    data: paginatedComments,
    fetchNextPage: fetchMoreComments,
    hasNextPage,
    isInitialLoading: isInitialCommentsLoading,
    isLoading: isLoadingComments,
    error: fetchCommentsError,
  } = useFetchCommentsQuery({
    thread_id: parseInt(`${thread.id}`) || 0,
    include_reactions: true,
    parent_id: parentCommentId,
    include_spam_comments: commentFilters.includeSpam,
    order_by: commentFilters.sortType,
    cursor: 1,
    limit: 10,
    apiEnabled: !!communityId && !!thread.id,
  });
  const allComments = (paginatedComments?.pages || []).flatMap(
    (page) => page.results,
  ) as CommentViewParams[];

  useRunOnceOnCondition({
    callback: () => {
      notifyError('Failed to load comments list');
    },
    shouldRun: !!fetchCommentsError,
  });

  const isAdminOrMod =
    Permissions.isSiteAdmin() ||
    Permissions.isCommunityAdmin() ||
    Permissions.isCommunityModerator();

  const commentRefs = useRef<(HTMLDivElement | null)[]>([]);

  if (isInitialCommentsLoading) {
    return <CWCircleMultiplySpinner />;
  }

  if (allComments.length === 0) return <></>;

  return (
    <>
      <div
        className={clsx('CommentsTree', {
          'replies-container': !!parentCommentId,
        })}
      >
        <Virtuoso
          className="comments-list"
          style={{ height: '100%', width: '100%' }}
          data={isInitialCommentsLoading ? [] : allComments}
          {...(pageRef.current && {
            customScrollParent: pageRef.current,
          })}
          itemContent={(index, comment) => {
            const isCommentAuthor =
              comment.address === user.activeAccount?.address;

            return (
              <div
                key={comment.id + '' + comment.marked_as_spam_at}
                ref={(el) => {
                  commentRefs.current[index] = el;
                }}
              >
                <div className={`Comment comment-${comment.id}`}>
                  <CommentCard
                    key={`${comment.id}-${comment.body}`}
                    disabledActionsTooltipText={disabledActionsTooltipText}
                    isThreadArchived={isThreadArchived}
                    canReply={canReply}
                    maxReplyLimitReached={
                      comment.comment_level >= MAX_COMMENT_DEPTH
                    }
                    replyBtnVisible={isReplyButtonVisible}
                    {...(comment.reply_count > 0 && {
                      repliesCount: comment.reply_count,
                    })}
                    canReact={canReact}
                    canEdit={
                      !isThreadLocked && (isCommentAuthor || isAdminOrMod)
                    }
                    editDraft={commentEdits?.[comment.id]?.editDraft || ''}
                    onEditStart={() => onEditStart(comment)}
                    onEditCancel={(hasContentChanged: boolean) =>
                      onEditCancel(comment, hasContentChanged)
                    }
                    onEditConfirm={async (newDelta) =>
                      await onEditConfirm(comment, newDelta)
                    }
                    isSavingEdit={
                      commentEdits?.[comment.id]?.isSavingEdit || false
                    }
                    isEditing={commentEdits?.[comment.id]?.isEditing || false}
                    canDelete={
                      !isThreadLocked && (isCommentAuthor || isAdminOrMod)
                    }
                    onReply={() => {
                      onCommentReplyStart(comment.id, index);
                    }}
                    onDelete={() => onDelete(comment)}
                    isSpam={!!comment.marked_as_spam_at}
                    onSpamToggle={() => onSpamToggle(comment)}
                    canToggleSpam={
                      !isThreadLocked && (isCommentAuthor || isAdminOrMod)
                    }
                    comment={comment}
                    shareURL={`${window.location.origin}${window.location.pathname}?comment=${comment.id}`}
                  />
                </div>
                {comment.reply_count > 0 && (
                  <TreeHierarchy
                    commentFilters={commentFilters}
                    isThreadArchived={!!thread.archivedAt}
                    isThreadLocked={isThreadLocked}
                    isReplyButtonVisible={isReplyButtonVisible}
                    onDelete={onDelete}
                    onEditStart={onEditStart}
                    onEditConfirm={onEditConfirm}
                    onEditCancel={onEditCancel}
                    onSpamToggle={onSpamToggle}
                    pageRef={pageRef}
                    isReplying={isReplying}
                    onCommentReplyStart={onCommentReplyStart}
                    onCommentReplyEnd={onCommentReplyEnd}
                    commentEdits={commentEdits}
                    canComment={canComment}
                    thread={thread}
                    disabledActionsTooltipText={disabledActionsTooltipText}
                    canReact={canReact}
                    canReply={canReply}
                    parentCommentId={comment.id}
                  />
                )}
                {isReplying.toComment &&
                  isReplying.parentCommentId === comment.id && (
                    <WithActiveStickyComment>
                      <CreateComment
                        handleIsReplying={onCommentReplyEnd}
                        parentCommentId={isReplying.parentCommentId}
                        rootThread={thread}
                        canComment={canComment}
                        isReplying={!!isReplying.toComment}
                        replyingToAuthor={comment.profile_name}
                        onCancel={() => {
                          onEditCancel(comment, false);
                        }}
                        tooltipText={
                          !canComment &&
                          typeof disabledActionsTooltipText === 'string'
                            ? disabledActionsTooltipText
                            : ''
                        }
                      />
                    </WithActiveStickyComment>
                  )}
              </div>
            );
          }}
          overscan={50}
          components={{
            // eslint-disable-next-line react/no-multi-comp
            EmptyPlaceholder: () => <></>,
            // eslint-disable-next-line react/no-multi-comp
            Footer: () =>
              hasNextPage ? (
                <CWButton
                  containerClassName="m-auto"
                  label="Load more"
                  disabled={isLoadingComments}
                  onClick={() => !isLoadingComments && fetchMoreComments()}
                />
              ) : (
                <></>
              ),
          }}
        />
      </div>
    </>
  );
};
