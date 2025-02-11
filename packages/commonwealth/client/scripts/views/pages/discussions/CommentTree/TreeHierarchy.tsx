import { MAX_COMMENT_DEPTH } from '@hicommonwealth/shared';
import clsx from 'clsx';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { registerAIStreamingCallback } from './helpers';
import { TreeHierarchyProps } from './types';

type ExtendedCommentViewParams = CommentViewParams & {
  hasOnAiReply?: boolean;
  onAiReplyType?: 'function';
  aiEnabled?: boolean;
};

export const TreeHierarchy = ({
  pageRef,
  thread,
  parentCommentId,
  isThreadLocked,
  isThreadArchived,
  isReplyingToCommentId,
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
}: TreeHierarchyProps) => {
  const user = useUserStore();
  const communityId = app.activeChainId() || '';
  const [streamingReplyIds, setStreamingReplyIds] = useState<number[]>([]);

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
  ) as ExtendedCommentViewParams[];

  const handleGenerateAIReply = useCallback(
    (commentId: number): Promise<void> => {
      if (streamingReplyIds.includes(commentId)) {
        return Promise.resolve();
      }

      const comment = allComments.find((c) => c.id === commentId);
      if (!comment) {
        console.error('TreeHierarchy - Comment not found:', commentId);
        return Promise.resolve();
      }

      setStreamingReplyIds((prev) => [...prev, commentId]);
      return Promise.resolve();
    },
    [allComments, streamingReplyIds],
  );

  useEffect(() => {
    const unregister = registerAIStreamingCallback((commentId) => {
      void handleGenerateAIReply(commentId);
    });

    return () => {
      unregister();
    };
  }, [handleGenerateAIReply]);

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

  const triggerStreamingForNewComment = useCallback((commentId: number) => {
    setStreamingReplyIds((prev) => [...prev, commentId]);
  }, []);

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
                    onEditConfirm={(newDelta) =>
                      onEditConfirm(comment, newDelta)
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
                    onAIReply={() => handleGenerateAIReply(comment.id)}
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
                    isReplyingToCommentId={isReplyingToCommentId}
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
                {streamingReplyIds.includes(comment.id) && (
                  <div className="replies-container">
                    <CommentCard
                      key={`streaming-${comment.id}`}
                      disabledActionsTooltipText={disabledActionsTooltipText}
                      isThreadArchived={isThreadArchived}
                      maxReplyLimitReached={true}
                      replyBtnVisible={false}
                      comment={{
                        ...comment,
                        id: comment.id,
                        body: '',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        address: comment.address,
                        comment_level: comment.comment_level + 1,
                        thread_id: comment.thread_id,
                        marked_as_spam_at: null,
                        reaction_count: 0,
                        reply_count: 0,
                      }}
                      isStreamingAIReply={true}
                      parentCommentText={comment.body}
                      onStreamingComplete={() => {
                        setStreamingReplyIds((prev) =>
                          prev.filter((id) => id !== comment.id),
                        );
                      }}
                      canReply={false}
                      canReact={false}
                      canEdit={false}
                      canDelete={false}
                      canToggleSpam={false}
                      shareURL=""
                    />
                  </div>
                )}
                {isReplyingToCommentId === comment.id && (
                  <WithActiveStickyComment>
                    <CreateComment
                      handleIsReplying={onCommentReplyEnd}
                      parentCommentId={isReplyingToCommentId}
                      rootThread={thread}
                      canComment={canComment}
                      isReplying={!!isReplyingToCommentId}
                      replyingToAuthor={comment.profile_name}
                      onCancel={() => {
                        onEditCancel(comment, false);
                      }}
                      onCommentCreated={(
                        newCommentId: number,
                        hasAI: boolean,
                      ) => {
                        if (hasAI) {
                          triggerStreamingForNewComment(newCommentId);
                        }
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
                  onClick={() => {
                    !isLoadingComments &&
                      fetchMoreComments().catch(console.error);
                  }}
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
