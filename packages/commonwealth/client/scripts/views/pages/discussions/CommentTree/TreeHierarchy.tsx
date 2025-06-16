import { MAX_COMMENT_DEPTH } from '@hicommonwealth/shared';
import clsx from 'clsx';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Virtuoso } from 'react-virtuoso';
import app from 'state';
import { useFetchCommentsQuery } from 'state/api/comments';
import useUserStore from 'state/ui/user';
import {
  AIModelOption,
  useLocalAISettingsStore,
} from 'state/ui/user/localAISettings';
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
import { TreeHierarchyProps as OriginalTreeHierarchyProps } from './types';

export type StreamingReplyInstance = {
  targetCommentId: number;
  modelId: string;
  modelName?: string;
};

export interface TreeHierarchyProps
  extends Omit<
    OriginalTreeHierarchyProps,
    'streamingReplyIds' | 'setStreamingReplyIds'
  > {
  streamingInstances: StreamingReplyInstance[];
  setStreamingInstances: (
    instances:
      | StreamingReplyInstance[]
      | ((prevInstances: StreamingReplyInstance[]) => StreamingReplyInstance[]),
  ) => void;
}

type ExtendedCommentViewParams = CommentViewParams & {
  hasOnAiReply?: boolean;
  onAiReplyType?: 'function';
  aiEnabled?: boolean;
};

const DEFAULT_MODEL: AIModelOption = {
  value: 'gpt-4o',
  label: 'GPT-4o',
};

export const TreeHierarchy = ({
  pageRef,
  thread,
  parentCommentId,
  isThreadLocked,
  isThreadArchived,
  isReplyingToCommentId,
  isReplyButtonVisible,
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
  streamingInstances,
  setStreamingInstances,
  permissions,
}: TreeHierarchyProps) => {
  const user = useUserStore();
  const communityId = app.activeChainId() || '';
  const { selectedModels } = useLocalAISettingsStore();

  const isChatMode = commentFilters.sortType === 'oldest';
  const previousChatModeRef = useRef(isChatMode);
  const isLoadingOlderMessagesRef = useRef(false);
  const previousCommentsLengthRef = useRef(0);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);

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

  const allComments = useMemo(() => {
    if (!paginatedComments?.pages) return [];

    const pages = paginatedComments.pages;
    if (isChatMode && !parentCommentId) {
      // For chat mode, reverse the pages array so older messages (newer pages) appear first
      return [...pages].reverse().flatMap((page) => page.results);
    }

    // For normal mode and replies, use standard order
    return pages.flatMap((page) => page.results);
  }, [
    paginatedComments?.pages,
    isChatMode,
    parentCommentId,
  ]) as ExtendedCommentViewParams[];

  const handleGenerateAIReply = useCallback(
    (
      targetCommentIdToReplyTo: number,
      useDefaultModelOnly = false,
    ): Promise<void> => {
      const commentBeingRepliedTo =
        allComments.find((c) => c.id === targetCommentIdToReplyTo) ||
        (targetCommentIdToReplyTo === thread.id ? thread : undefined);

      if (!commentBeingRepliedTo) {
        console.warn(
          `Comment with id ${targetCommentIdToReplyTo} not found for AI reply.`,
        );
        return Promise.resolve();
      }

      // If useDefaultModelOnly is true, only use the first selected model
      const modelsToUse = useDefaultModelOnly
        ? [DEFAULT_MODEL]
        : selectedModels;

      const newInstances = modelsToUse.map((model: AIModelOption) => ({
        targetCommentId: targetCommentIdToReplyTo,
        modelId: model.value,
        modelName: model.label,
      }));

      setStreamingInstances((prev) => {
        const existingKeys = new Set(
          prev.map((p) => `${p.targetCommentId}-${p.modelId}`),
        );
        const filteredNewInstances = newInstances.filter(
          (n) => !existingKeys.has(`${n.targetCommentId}-${n.modelId}`),
        );
        return [...prev, ...filteredNewInstances];
      });

      return Promise.resolve();
    },
    [allComments, selectedModels, setStreamingInstances, thread],
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

  // Auto-scroll to bottom when entering chat mode or when new comments are added in chat mode
  // But NOT when loading older messages
  useEffect(() => {
    if (
      isChatMode &&
      commentFilters.sortType === 'oldest' &&
      !parentCommentId
    ) {
      const shouldAutoScroll =
        // When first entering chat mode
        (!previousChatModeRef.current && isChatMode) ||
        // When new comments are added (but not when loading older messages)
        (isChatMode &&
          previousChatModeRef.current &&
          allComments.length > previousCommentsLengthRef.current &&
          !isLoadingOlderMessagesRef.current);

      if (shouldAutoScroll && allComments.length > 0) {
        // Small delay to ensure comments are rendered
        setTimeout(() => {
          try {
            const lastComment = allComments[allComments.length - 1];
            if (lastComment) {
              const element = document.querySelector(
                `.comment-${lastComment.id}`,
              );
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              } else {
                console.warn(
                  `Could not find element for comment ${lastComment.id} to scroll to.`,
                );
              }
            }
          } catch (error) {
            console.warn('Auto-scroll failed:', error);
          }
        }, 100);
      }
    }

    previousChatModeRef.current = isChatMode;
    previousCommentsLengthRef.current = allComments.length;
  }, [
    isChatMode,
    allComments.length,
    commentFilters.sortType,
    parentCommentId,
    allComments,
  ]);

  const triggerStreamingForNewComment = useCallback(
    (commentId: number, useDefaultModelOnly = false) => {
      // If useDefaultModelOnly is true, only use the first selected model

      const modelsToUse = useDefaultModelOnly
        ? [DEFAULT_MODEL]
        : selectedModels;

      const newInstances = modelsToUse.map((model: AIModelOption) => ({
        targetCommentId: commentId,
        modelId: model.value,
        modelName: model.label,
      }));
      setStreamingInstances((prev) => [...prev, ...newInstances]);
    },
    [selectedModels, setStreamingInstances],
  );

  if (isInitialCommentsLoading) {
    return <CWCircleMultiplySpinner />;
  }

  const rootStreamingInstances = parentCommentId
    ? []
    : streamingInstances.filter(
        (instance) => instance.targetCommentId === thread.id,
      );

  if (rootStreamingInstances.length > 0 && !parentCommentId) {
    return (
      <>
        {rootStreamingInstances.map((instance) => {
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
            <div
              className="streaming-root-comment"
              key={`streaming-thread-${instance.modelId}`}
            >
              <CommentCard
                comment={tempRootComment}
                isStreamingAIReply={true}
                streamingModelId={instance.modelId}
                modelName={instance.modelName}
                isRootComment={true}
                threadContext={thread.body}
                threadTitle={thread.title}
                onStreamingComplete={() => {
                  setStreamingInstances((prev) =>
                    prev.filter(
                      (si) =>
                        !(
                          si.targetCommentId === thread.id &&
                          si.modelId === instance.modelId
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
                permissions={permissions}
              />
            </div>
          );
        })}
      </>
    );
  }

  if (
    allComments.length === 0 &&
    !parentCommentId &&
    rootStreamingInstances.length === 0
  )
    return <></>;
  if (allComments.length === 0 && parentCommentId) return <></>;

  const renderCommentItem = (
    comment: ExtendedCommentViewParams,
    index: number,
  ) => {
    const isCommentAuthor = comment.address === user.activeAccount?.address;

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
            isThreadArchived={isThreadArchived}
            canReply={canReply}
            maxReplyLimitReached={comment.comment_level >= MAX_COMMENT_DEPTH}
            replyBtnVisible={isReplyButtonVisible}
            {...(comment.reply_count > 0 && {
              repliesCount: comment.reply_count,
            })}
            canReact={canReact}
            canEdit={!isThreadLocked && (isCommentAuthor || isAdminOrMod)}
            editDraft={commentEdits?.[comment.id]?.editDraft || ''}
            onEditStart={() => onEditStart(comment)}
            onEditCancel={(hasContentChanged: boolean) =>
              onEditCancel(comment, hasContentChanged)
            }
            onEditConfirm={(newDelta) => onEditConfirm(comment, newDelta)}
            isSavingEdit={commentEdits?.[comment.id]?.isSavingEdit || false}
            isEditing={commentEdits?.[comment.id]?.isEditing || false}
            canDelete={!isThreadLocked && (isCommentAuthor || isAdminOrMod)}
            onReply={() => {
              onCommentReplyStart(comment.id, index);
            }}
            onAIReply={() => {
              return handleGenerateAIReply(comment.id, true);
            }}
            onDelete={() => onDelete(comment)}
            isSpam={!!comment.marked_as_spam_at}
            onSpamToggle={() => onSpamToggle(comment)}
            canToggleSpam={!isThreadLocked && (isCommentAuthor || isAdminOrMod)}
            comment={comment}
            shareURL={`${window.location.origin}${window.location.pathname}?comment=${comment.id}`}
            weightType={thread.topic?.weighted_voting}
            tokenNumDecimals={thread.topic?.token_decimals || undefined}
            threadContext={thread.body}
            permissions={permissions}
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
            canReact={canReact}
            canReply={canReply}
            parentCommentId={comment.id}
            streamingInstances={streamingInstances}
            setStreamingInstances={setStreamingInstances}
            permissions={permissions}
          />
        )}
        {streamingInstances
          .filter((instance) => instance.targetCommentId === comment.id)
          .map((instance) => (
            <div
              className="replies-container"
              key={`streaming-${comment.id}-${instance.modelId}`}
            >
              <CommentCard
                permissions={permissions}
                isThreadArchived={isThreadArchived}
                maxReplyLimitReached={true}
                replyBtnVisible={false}
                comment={{
                  ...comment,
                  id: comment.id,
                  body: '',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  address: user.activeAccount?.address || '',
                  comment_level: comment.comment_level + 1,
                  thread_id: comment.thread_id,
                  marked_as_spam_at: null,
                  reaction_count: 0,
                  reply_count: 0,
                  user_id: user.id,
                  // Use fallbacks for profile_name
                  profile_name: user.activeAccount?.address || 'AI Assistant',
                }}
                isStreamingAIReply={true}
                streamingModelId={instance.modelId}
                modelName={instance.modelName}
                parentCommentText={comment.body}
                threadContext={thread.body}
                onStreamingComplete={() => {
                  setStreamingInstances((prev) =>
                    prev.filter(
                      (si) =>
                        !(
                          si.targetCommentId === comment.id &&
                          si.modelId === instance.modelId
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
                tokenNumDecimals={thread.topic?.token_decimals || undefined}
              />
            </div>
          ))}
        {isReplyingToCommentId === comment.id && (
          <WithActiveStickyComment>
            <CreateComment
              handleIsReplying={onCommentReplyEnd}
              parentCommentId={isReplyingToCommentId}
              rootThread={thread}
              canComment={canComment}
              isReplying={!!isReplyingToCommentId}
              replyingToAuthor={comment.profile_name}
              parentCommentText={comment.body}
              onCancel={() => {
                onEditCancel(comment, false);
              }}
              onCommentCreated={(newCommentId: number, hasAI: boolean) => {
                if (hasAI) {
                  triggerStreamingForNewComment(newCommentId, true);
                }
              }}
              tooltipText={permissions.CREATE_COMMENT.tooltip}
            />
          </WithActiveStickyComment>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        className={clsx('CommentsTree', {
          'replies-container': !!parentCommentId,
          'chat-mode': isChatMode && !parentCommentId,
        })}
      >
        {parentCommentId ? (
          // For replies, render directly without Virtuoso to avoid nesting issues
          <div>{allComments.map(renderCommentItem)}</div>
        ) : (
          // For root comments, use Virtuoso for performance
          <Virtuoso
            className="comments-list"
            style={{ height: '100%', width: '100%' }}
            data={isInitialCommentsLoading ? [] : allComments}
            {...(pageRef.current && {
              customScrollParent: pageRef.current,
            })}
            {...(isChatMode &&
              commentFilters.sortType === 'oldest' &&
              !parentCommentId && {
                followOutput: !isLoadingOlderMessages,
                reversed: true,
              })}
            itemContent={(index, comment) => renderCommentItem(comment, index)}
            overscan={50}
            components={{
              // eslint-disable-next-line react/no-multi-comp
              EmptyPlaceholder: () => <></>,
              ...(isChatMode && !parentCommentId
                ? {
                    // eslint-disable-next-line react/no-multi-comp
                    Header: () => {
                      const lastPage =
                        paginatedComments?.pages?.[
                          paginatedComments.pages.length - 1
                        ];
                      const canLoadMore =
                        hasNextPage &&
                        lastPage &&
                        lastPage.page < lastPage.totalPages &&
                        !isLoadingComments &&
                        !isLoadingOlderMessages &&
                        allComments.length > 0; // Only show if we have comments to display

                      return canLoadMore ? (
                        <div className="chat-load-older-container">
                          <CWButton
                            containerClassName="m-auto"
                            label="Load older messages"
                            disabled={
                              isLoadingComments || isLoadingOlderMessages
                            }
                            onClick={async () => {
                              if (!isLoadingComments && canLoadMore) {
                                setIsLoadingOlderMessages(true);
                                isLoadingOlderMessagesRef.current = true;
                                try {
                                  await fetchMoreComments();
                                } catch (error) {
                                  console.error(
                                    'Failed to load older messages:',
                                    error,
                                  );
                                } finally {
                                  // Reset the flag after a delay to allow for rendering
                                  setTimeout(() => {
                                    setIsLoadingOlderMessages(false);
                                    isLoadingOlderMessagesRef.current = false;
                                  }, 500);
                                }
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <></>
                      );
                    },
                  }
                : {
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
                  }),
            }}
          />
        )}
      </div>
    </>
  );
};
