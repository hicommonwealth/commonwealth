import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import {
  DEFAULT_AI_ASSISTANT_NAME,
  DEFAULT_COMPLETION_MODEL,
  DEFAULT_COMPLETION_MODEL_LABEL,
  MAX_COMMENT_DEPTH,
} from '@hicommonwealth/shared';
import {
  AIModelOption,
  useUserAiSettingsStore,
} from 'client/scripts/state/ui/user/userAiSettings';
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
import { trpc } from 'utils/trpcClient';
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
  autoLoadNestedParentLevelReplies?: Boolean;
}

type ExtendedCommentViewParams = CommentViewParams & {
  hasOnAiReply?: boolean;
  onAiReplyType?: 'function';
  aiEnabled?: boolean;
};

const DEFAULT_MODEL: AIModelOption = {
  value: DEFAULT_COMPLETION_MODEL,
  label: DEFAULT_COMPLETION_MODEL_LABEL,
};

export const TreeHierarchy = ({
  pageRef,
  thread,
  parentComment,
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
  autoLoadNestedParentLevelReplies,
}: TreeHierarchyProps) => {
  const user = useUserStore();
  const communityId = app.activeChainId() || '';
  const { selectedModels } = useUserAiSettingsStore();
  const utils = trpc.useUtils();

  const isChatMode = commentFilters.sortType === 'oldest';
  const previousChatModeRef = useRef(isChatMode);
  const isLoadingOlderMessagesRef = useRef(false);
  const previousCommentsLengthRef = useRef(0);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [loadButtonClicked, setLoadButtonClicked] = useState(
    autoLoadNestedParentLevelReplies || false,
  );
  const [
    _autoLoadNestedParentLevelReplies,
    setAutoLoadNestedParentLevelReplies,
  ] = useState(false);
  // do not load all children beyond 2nd level, allow 2nd level to be expanded, level starts from 0
  const shouldLoadWithBtnClick = parentComment && parentComment?.level >= 1;

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
    parent_id: parentComment?.id,
    include_spam_comments: commentFilters.includeSpam,
    order_by: commentFilters.sortType,
    cursor: 1,
    limit: 10,
    apiEnabled: !!communityId && !!thread.id,
  });

  const allComments = useMemo(() => {
    if (!paginatedComments?.pages) return [];

    const pages = paginatedComments.pages;
    if (isChatMode && !parentComment?.id) {
      // For chat mode, reverse the pages array so older messages (newer pages) appear first
      return [...pages].reverse().flatMap((page) => page.results);
    }

    // For normal mode and replies, use standard order
    return pages.flatMap((page) => page.results);
  }, [
    paginatedComments?.pages,
    isChatMode,
    parentComment?.id,
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

      setAutoLoadNestedParentLevelReplies(true); // show the replies afterwards

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

  // Transform CreateComment output to CommentsView format for cache
  const transformCommentToView = useCallback(
    (payload: Record<string, unknown>): CommentViewParams => {
      // Helper to convert Date to ISO string
      const toDateString = (val: unknown): string | null | undefined => {
        if (val === null || val === undefined) return val;
        if (val instanceof Date) return val.toISOString();
        return val as string;
      };

      // Extract Address data (may be nested from CreateComment output)
      const rawAddress = payload.Address as Record<string, unknown> | undefined;

      // Transform Address dates if present
      const transformedAddress = rawAddress
        ? {
            ...rawAddress,
            created_at: toDateString(rawAddress.created_at),
            updated_at: toDateString(rawAddress.updated_at),
          }
        : undefined;

      const addressData = transformedAddress as
        | {
            address?: string;
            user_id?: number;
            User?: {
              id?: number;
              profile?: { name?: string; avatar_url?: string };
            };
          }
        | undefined;

      return {
        ...payload,
        // Flatten address fields for CommentsView schema
        address: addressData?.address || (payload.address as string) || '',
        profile_name:
          addressData?.User?.profile?.name ||
          (payload.profile_name as string) ||
          undefined,
        avatar_url:
          addressData?.User?.profile?.avatar_url ||
          (payload.avatar_url as string) ||
          undefined,
        user_id:
          addressData?.user_id ||
          addressData?.User?.id ||
          (payload.user_id as number) ||
          0,
        // Ensure reactions array exists
        reactions: (payload.reactions as unknown[]) || [],
        // Convert date fields to strings (server may return Date objects)
        created_at: toDateString(payload.created_at),
        updated_at: toDateString(payload.updated_at),
        deleted_at: toDateString(payload.deleted_at),
        marked_as_spam_at: toDateString(payload.marked_as_spam_at),
        last_active: toDateString(payload.last_active),
        // Include transformed Address
        Address: transformedAddress,
      } as CommentViewParams;
    },
    [],
  );

  // Add a new AI comment directly to the cache without refetching
  const addCommentToCache = useCallback(
    (commentPayload: Record<string, unknown>) => {
      if (!commentPayload || !commentPayload.id) {
        console.warn('[TreeHierarchy] Invalid comment payload received');
        return;
      }

      // Transform to CommentsView format
      const commentView = transformCommentToView(commentPayload);

      // Try to add to the comment's parent cache first (where it belongs)
      const commentParentId = commentView.parent_id as number | undefined;
      const isChatModeForParent =
        commentFilters.sortType === 'oldest' && commentParentId === undefined;

      console.log('[TreeHierarchy] Adding comment to cache', {
        commentId: commentView.id,
        parentId: commentParentId,
        currentViewParentId: parentComment?.id,
      });

      let cacheFound = false;

      // First, try the exact parent cache (where the reply belongs)
      utils.comment.getComments.setInfiniteData(
        {
          thread_id: parseInt(`${thread.id}`) || 0,
          comment_id: undefined,
          include_reactions: true,
          parent_id: commentParentId,
          include_spam_comments: commentFilters.includeSpam,
          order_by: commentFilters.sortType,
          is_chat_mode: isChatModeForParent,
        },
        (oldData) => {
          if (!oldData) {
            return oldData;
          }

          cacheFound = true;
          console.log('[TreeHierarchy] Found parent cache, adding comment');

          const newPages = oldData.pages.map((page, index) => {
            if (index === 0) {
              const exists = page.results.some(
                (c: { id: number }) => c.id === commentView.id,
              );
              if (exists) {
                return page;
              }
              return {
                ...page,
                results: [
                  commentView as (typeof page.results)[number],
                  ...page.results,
                ],
              };
            }
            return page;
          });

          return { ...oldData, pages: newPages };
        },
      );

      // If parent cache wasn't found but we're at a different view level,
      // try the current view's cache (parent_id matches current view)
      if (!cacheFound && commentParentId !== parentComment?.id) {
        const currentViewParentId = parentComment?.id;
        const isChatModeForView =
          commentFilters.sortType === 'oldest' &&
          currentViewParentId === undefined;

        utils.comment.getComments.setInfiniteData(
          {
            thread_id: parseInt(`${thread.id}`) || 0,
            comment_id: undefined,
            include_reactions: true,
            parent_id: currentViewParentId,
            include_spam_comments: commentFilters.includeSpam,
            order_by: commentFilters.sortType,
            is_chat_mode: isChatModeForView,
          },
          (oldData) => {
            if (!oldData) {
              return oldData;
            }

            cacheFound = true;
            console.log(
              '[TreeHierarchy] Found current view cache, updating parent reply count',
            );

            // Update the parent comment's reply_count in the cache
            const newPages = oldData.pages.map((page) => ({
              ...page,
              results: page.results.map((comment) => {
                if (comment.id === commentParentId) {
                  return {
                    ...comment,
                    reply_count: (comment.reply_count || 0) + 1,
                  };
                }
                return comment;
              }),
            }));

            return { ...oldData, pages: newPages };
          },
        );
      }

      if (!cacheFound) {
        console.log(
          '[TreeHierarchy] No cache found for comment, it will appear on next load',
        );
      }
    },
    [
      utils.comment.getComments,
      thread.id,
      commentFilters.includeSpam,
      commentFilters.sortType,
      transformCommentToView,
      parentComment?.id,
    ],
  );

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
      !parentComment?.id
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
    parentComment?.id,
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

  const rootStreamingInstances = parentComment?.id
    ? []
    : streamingInstances.filter(
        (instance) => instance.targetCommentId === thread.id,
      );

  if (rootStreamingInstances.length > 0 && !parentComment?.id) {
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
            profile_name: 'AI Assistant',
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
                onStreamingComplete={(commentPayload) => {
                  // Add comment to cache if payload received, then remove streaming instance
                  if (commentPayload) {
                    addCommentToCache(commentPayload);
                  }
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
                weightType={
                  thread.topic?.weighted_voting as TopicWeightedVoting
                }
                tokenNumDecimals={thread.topic?.token_decimals || undefined}
                tokenSymbol={thread.topic?.token_symbol || undefined}
                permissions={permissions}
              />
            </div>
          );
        })}
      </>
    );
  }

  if (shouldLoadWithBtnClick && !loadButtonClicked) {
    if (
      !isInitialCommentsLoading &&
      !isLoadingComments &&
      allComments.length === 0
    ) {
      // IMP: don't show anything. The load button, glitches, if clicked when no comments exist
    } else {
      return (
        <CWButton
          containerClassName="m-auto"
          buttonType="secondary"
          buttonHeight="sm"
          buttonWidth="narrow"
          label="Load replies"
          disabled={isLoadingComments || isInitialCommentsLoading}
          onClick={() => setLoadButtonClicked(true)}
        />
      );
    }
  }

  if (
    allComments.length === 0 &&
    !parentComment?.id &&
    rootStreamingInstances.length === 0
  )
    return <></>;
  if (allComments.length === 0 && parentComment?.id) return <></>;

  const renderCommentItem = (
    comment: ExtendedCommentViewParams,
    index: number,
  ) => {
    const isCommentAuthor = comment.address === user.activeAccount?.address;
    const isTriggeredByCurrentUser = !!(
      comment.triggered_by_user_id && comment.triggered_by_user_id === user.id
    );

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
            canDelete={
              !isThreadLocked &&
              (isCommentAuthor || isAdminOrMod || isTriggeredByCurrentUser)
            }
            onReply={() => {
              onCommentReplyStart(comment.id, index);
            }}
            onAIReply={() => {
              return handleGenerateAIReply(comment.id, true);
            }}
            onDelete={() => onDelete(comment)}
            isSpam={!!comment.marked_as_spam_at}
            onSpamToggle={() => onSpamToggle(comment)}
            canToggleSpam={
              !isThreadLocked &&
              (isCommentAuthor || isAdminOrMod || isTriggeredByCurrentUser)
            }
            comment={comment}
            shareURL={`${window.location.origin}${window.location.pathname}?comment=${comment.id}`}
            weightType={thread.topic?.weighted_voting as TopicWeightedVoting}
            tokenNumDecimals={thread.topic?.token_decimals || undefined}
            tokenSymbol={thread.topic?.token_symbol || undefined}
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
            parentComment={{ id: comment.id, level: comment.comment_level }}
            streamingInstances={streamingInstances}
            setStreamingInstances={setStreamingInstances}
            permissions={permissions}
            autoLoadNestedParentLevelReplies={_autoLoadNestedParentLevelReplies}
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
                  // Use AI Assistant for profile_name
                  profile_name: DEFAULT_AI_ASSISTANT_NAME,
                }}
                isStreamingAIReply={true}
                streamingModelId={instance.modelId}
                modelName={instance.modelName}
                parentCommentText={comment.body}
                threadContext={thread.body}
                onStreamingComplete={(commentPayload) => {
                  // Add comment to cache if payload received, then remove streaming instance
                  if (commentPayload) {
                    addCommentToCache(commentPayload);
                  }
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
                weightType={
                  thread.topic?.weighted_voting as TopicWeightedVoting
                }
                tokenNumDecimals={thread.topic?.token_decimals || undefined}
                tokenSymbol={thread.topic?.token_symbol || undefined}
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
          'replies-container': !!parentComment?.id,
          'chat-mode': isChatMode && !parentComment?.id,
        })}
      >
        {parentComment?.id ? (
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
              !parentComment?.id && {
                followOutput: !isLoadingOlderMessages,
                reversed: true,
              })}
            itemContent={(index, comment) => renderCommentItem(comment, index)}
            overscan={50}
            components={{
              // eslint-disable-next-line react/no-multi-comp
              EmptyPlaceholder: () => <></>,
              ...(isChatMode && !parentComment?.id
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
