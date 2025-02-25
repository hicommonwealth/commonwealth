import { MAX_COMMENT_DEPTH } from '@hicommonwealth/shared';
import clsx from 'clsx';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import React, { useCallback, useEffect, useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';
import app from 'state';
import { useFetchCommentsQuery } from 'state/api/comments';
import useUserStore from 'state/ui/user';
import { useLocalAISettingsStore } from 'state/ui/user/localAISettings';
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
  streamingReplyIds,
  setStreamingReplyIds,
}: TreeHierarchyProps) => {
  const user = useUserStore();
  const communityId = app.activeChainId() || '';
  const { selectedModels } = useLocalAISettingsStore();

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
      // Check if we're already streaming a reply for this comment
      const isAlreadyStreaming = streamingReplyIds.some((reply) =>
        typeof reply === 'number'
          ? reply === commentId
          : reply.commentId === commentId,
      );

      if (isAlreadyStreaming) {
        return Promise.resolve();
      }

      const comment = allComments.find((c) => c.id === commentId);
      if (!comment) {
        return Promise.resolve();
      }

      // Use models from the store, or default to Claude if none selected
      const modelsToUse =
        selectedModels.length > 0
          ? selectedModels.map((model) => model.value)
          : ['anthropic/claude-3.5-sonnet'];

      // Create a streaming reply entry for each selected model
      modelsToUse.forEach((modelId) => {
        setStreamingReplyIds((prev) => [...prev, { commentId, modelId }]);
      });

      return Promise.resolve();
    },
    [allComments, streamingReplyIds, selectedModels],
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

  // Check if thread has a streaming reply using either format (number or object)
  const isThreadStreaming = streamingReplyIds.some((id) =>
    typeof id === 'number' ? id === thread.id : id.commentId === thread.id,
  );

  if (isThreadStreaming && !parentCommentId) {
    const tempRootComment = {
      id: thread.id,
      body: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      address: user.activeAccount?.address || '',
      address_id: user.id,
      comment_level: 0,
      thread_id: thread.id,
      community_id: thread.communityId,
      marked_as_spam_at: null,
      reaction_count: 0,
      reply_count: 0,
      user_id: user.id,
      profile_name: user.activeAccount?.address || '',
    };

    return (
      <div className="streaming-root-comment">
        {/* Find all streaming replies for this thread */}
        {streamingReplyIds
          .filter((id) =>
            typeof id === 'number'
              ? id === thread.id
              : id.commentId === thread.id,
          )
          .map((streamingReply) => {
            // Get model ID if it's a StreamingReplyData object
            const modelId =
              typeof streamingReply === 'number'
                ? 'anthropic/claude-3.5-sonnet' // Default model
                : streamingReply.modelId;

            const modelLabel =
              selectedModels.find((m) => m.value === modelId)?.label ||
              modelId.split('/').pop() ||
              'AI';

            return (
              <CommentCard
                key={`streaming-${thread.id}-${modelId}`}
                comment={{
                  ...tempRootComment,
                  modelName: modelLabel,
                }}
                isStreamingAIReply={true}
                isRootComment={true}
                threadContext={thread.body}
                streamingModelId={modelId}
                onStreamingComplete={() => {
                  setStreamingReplyIds((prev) =>
                    prev.filter((id) =>
                      typeof id === 'number'
                        ? id !== thread.id
                        : !(
                            id.commentId === thread.id && id.modelId === modelId
                          ),
                    ),
                  );
                }}
                canReply={false}
                canReact={false}
                canEdit={false}
                canDelete={false}
                canToggleSpam={false}
                shareURL=""
                maxReplyLimitReached={false}
                isThreadArchived={false}
              />
            );
          })}
      </div>
    );
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
                    weightType={thread.topic?.weighted_voting}
                    threadContext={thread.body}
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
                    streamingReplyIds={streamingReplyIds}
                    setStreamingReplyIds={setStreamingReplyIds}
                  />
                )}
                {streamingReplyIds.some((id) =>
                  typeof id === 'number'
                    ? id === comment.id
                    : id.commentId === comment.id,
                ) && (
                  <div className="replies-container">
                    {/* Find all streaming replies for this comment */}
                    {streamingReplyIds
                      .filter((id) =>
                        typeof id === 'number'
                          ? id === comment.id
                          : id.commentId === comment.id,
                      )
                      .map((streamingReply, index) => {
                        // Get model ID if it's a StreamingReplyData object
                        const modelId =
                          typeof streamingReply === 'number'
                            ? 'anthropic/claude-3.5-sonnet' // Default model
                            : streamingReply.modelId;

                        const modelLabel =
                          selectedModels.find((m) => m.value === modelId)
                            ?.label ||
                          modelId.split('/').pop() ||
                          'AI';

                        return (
                          <CommentCard
                            key={`streaming-${comment.id}-${modelId}`}
                            disabledActionsTooltipText={
                              disabledActionsTooltipText
                            }
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
                              // Add model information as custom field
                              modelName: modelLabel,
                            }}
                            isStreamingAIReply={true}
                            parentCommentText={comment.body}
                            threadContext={thread.body}
                            streamingModelId={modelId}
                            onStreamingComplete={() => {
                              setStreamingReplyIds((prev) =>
                                prev.filter((id) =>
                                  typeof id === 'number'
                                    ? id !== comment.id
                                    : !(
                                        id.commentId === comment.id &&
                                        id.modelId === modelId
                                      ),
                                ),
                              );
                            }}
                            canReply={false}
                            canReact={false}
                            canEdit={false}
                            canDelete={false}
                            canToggleSpam={false}
                            shareURL=""
                          />
                        );
                      })}
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
