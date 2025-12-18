import type { DeltaStatic } from 'quill';
import React, { useEffect, useRef, useState } from 'react';

import { CommentsView, TopicWeightedVoting } from '@hicommonwealth/schemas';
import {
  CanvasSignedData,
  CompletionModel,
  DEFAULT_NAME,
  deserializeCanvas,
  GatedActionEnum,
  UserTierMap,
  verify,
} from '@hicommonwealth/shared';
import { AICompletionType, useAiCompletion } from 'client/scripts/state/api/ai';
import clsx from 'clsx';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import moment from 'moment';
import { useCreateCommentMutation } from 'state/api/comments';
import useGetCommunityByIdQuery from 'state/api/communities/getCommuityById';
import useGetContentByUrlQuery from 'state/api/general/getContentByUrl';
import useUserStore, { useAIFeatureEnabled } from 'state/ui/user';
import { useUserAiSettingsStore } from 'state/ui/user/userAiSettings';
import { trpc } from 'utils/trpcClient';
import { MarkdownViewerWithFallback } from 'views/components/MarkdownViewerWithFallback/MarkdownViewerWithFallback';
import { CommentReactionButton } from 'views/components/ReactionButton/CommentReactionButton';
import ShareButton from 'views/components/ShareButton';
import {
  ViewCommentUpvotesDrawer,
  ViewUpvotesDrawerTrigger,
} from 'views/components/UpvoteDrawer';
import { PopoverMenu } from 'views/components/component_kit/CWPopoverMenu';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';
import { ReactQuillEditor } from 'views/components/react_quill_editor';
import { deserializeDelta } from 'views/components/react_quill_editor/utils';
import { z } from 'zod';
import Permissions from '../../../../utils/Permissions';
import { AuthorAndPublishInfo } from '../ThreadCard/AuthorAndPublishInfo';
import './CommentCard.scss';
import { ToggleCommentSubscribe } from './ToggleCommentSubscribe';

export type CommentViewParams = z.infer<typeof CommentsView>;

const actionPermissions = [
  GatedActionEnum.CREATE_COMMENT,
  GatedActionEnum.CREATE_COMMENT_REACTION,
] as const;

type CommentCardProps = {
  // Edit
  canEdit?: boolean;
  onEditStart?: () => any;
  onEditConfirm?: (comment: DeltaStatic) => any;
  onEditCancel?: (hasContentChanged: boolean) => any;
  isEditing?: boolean;
  isSavingEdit?: boolean;
  editDraft?: string;
  // Delete
  canDelete?: boolean;
  onDelete?: () => any;
  // Reply
  replyBtnVisible?: boolean;
  repliesCount?: number;
  onReply?: () => any;
  canReply?: boolean;
  maxReplyLimitReached: boolean;
  // Reaction
  canReact?: boolean;
  hideReactButton?: boolean;
  viewUpvotesButtonVisible?: boolean;
  // Spam
  isSpam?: boolean;
  onSpamToggle?: () => any;
  canToggleSpam?: boolean;
  // actual comment
  comment: CommentViewParams;
  isThreadArchived: boolean;
  // other
  className?: string;
  shareURL: string;
  weightType?: TopicWeightedVoting | null;
  onAIReply?: (commentText?: string) => Promise<void>;
  // AI streaming props
  isStreamingAIReply?: boolean;
  streamingModelId?: string;
  modelName?: string;
  parentCommentText?: string;
  onStreamingComplete?: (commentPayload?: Record<string, unknown>) => void;
  // voting
  tokenNumDecimals?: number;
  tokenSymbol?: string;
  // Add props for root-level comment generation
  isRootComment?: boolean;
  threadContext?: string;
  threadTitle?: string;
  permissions: ReturnType<
    typeof Permissions.getMultipleActionsPermission<typeof actionPermissions>
  >;
};

export const CommentCard = ({
  // edit
  editDraft,
  canEdit,
  onEditStart,
  onEditCancel,
  onEditConfirm,
  isEditing,
  isSavingEdit,
  // delete
  canDelete,
  onDelete,
  // reply
  replyBtnVisible,
  repliesCount,
  onReply,
  canReply,
  maxReplyLimitReached,
  // reaction
  canReact,
  hideReactButton = false,
  viewUpvotesButtonVisible = true,
  // spam
  isSpam,
  onSpamToggle,
  canToggleSpam,
  // actual comment
  comment,
  isThreadArchived,
  // other
  className,
  shareURL,
  weightType,
  onAIReply,
  isStreamingAIReply,
  streamingModelId,
  modelName,
  parentCommentText,
  onStreamingComplete,
  tokenNumDecimals,
  tokenSymbol,
  isRootComment,
  threadContext,
  threadTitle,
  permissions,
}: CommentCardProps) => {
  const user = useUserStore();
  const userOwnsComment = comment.user_id === user.id;
  const [streamingText, setStreamingText] = useState('');
  const { generateCompletion } = useAiCompletion();
  const utils = trpc.useUtils();

  // Fetch community details
  const { data: community } = useGetCommunityByIdQuery({
    id: comment?.community_id || '',
    enabled: !!comment?.community_id,
  });

  const { isAIEnabled } = useAIFeatureEnabled();
  const { webSearchEnabled } = useUserAiSettingsStore();

  const { mutateAsync: createComment } = useCreateCommentMutation({
    threadId: comment.thread_id,
    communityId: comment.community_id,
    existingNumberOfComments: 0,
  });

  // Use ref for generateCompletion to avoid effect re-runs
  const generateCompletionRef = useRef(generateCompletion);
  useEffect(() => {
    generateCompletionRef.current = generateCompletion;
  }, [generateCompletion]);

  // Use ref for utils to avoid effect re-runs
  const utilsRef = useRef(utils);
  useEffect(() => {
    utilsRef.current = utils;
  }, [utils]);

  // Track if an AI request is already in progress to prevent duplicate calls
  // This ref persists across StrictMode re-mounts and is used to check if we should process results
  const streamingStateRef = useRef<{
    inProgress: boolean;
    commentId: number | null;
  }>({
    inProgress: false,
    commentId: null,
  });

  const [commentText, setCommentText] = useState(comment.body);
  const commentBody = React.useMemo(() => {
    const rawContent = editDraft || commentText || comment.body;
    const deserializedContent = deserializeDelta(rawContent);
    return deserializedContent;
  }, [editDraft, commentText, comment.body]);
  const [commentDelta, setCommentDelta] = useState<DeltaStatic>(commentBody);
  const [verifiedCanvasSignedData, setVerifiedCanvasSignedData] =
    useState<CanvasSignedData | null>(null);
  const [, setOnReaction] = useState<boolean>(false);
  const [isUpvoteDrawerOpen, setIsUpvoteDrawerOpen] = useState<boolean>(false);

  const [contentUrlBodyToFetch, setContentUrlBodyToFetch] = useState<
    string | null
  >(null);
  useEffect(() => {
    setCommentDelta(commentBody);
  }, [commentBody]);
  useRunOnceOnCondition({
    callback: () => {
      comment.content_url && setContentUrlBodyToFetch(comment.content_url);
    },
    shouldRun: !!comment.content_url,
  });

  const { data: contentUrlBody, isLoading: isLoadingContentBody } =
    useGetContentByUrlQuery({
      contentUrl: contentUrlBodyToFetch || '',
      enabled: !!contentUrlBodyToFetch,
    });

  useEffect(() => {
    if (
      contentUrlBodyToFetch &&
      contentUrlBodyToFetch !== comment.content_url &&
      contentUrlBody
    ) {
      setCommentText(contentUrlBody);
      setCommentDelta(contentUrlBody);
    }
  }, [contentUrlBody, contentUrlBodyToFetch, comment.content_url]);

  useRunOnceOnCondition({
    callback: () => {
      if (contentUrlBody) {
        setCommentText(contentUrlBody);
        setCommentDelta(contentUrlBody);
      }
    },
    shouldRun:
      !isLoadingContentBody && !!comment.content_url && !!contentUrlBody,
  });

  useEffect(() => {
    try {
      const canvasSignedData: CanvasSignedData = deserializeCanvas(
        comment.canvas_signed_data || '',
      );
      if (!canvasSignedData) return;
      verify(canvasSignedData)
        .then(() => {
          setVerifiedCanvasSignedData(canvasSignedData);
        })
        .catch(() => null);
    } catch (error) {
      // ignore errors or missing data
    }
  }, [comment.canvas_signed_data]);

  const createCommentRef = useRef(createComment);
  useEffect(() => {
    createCommentRef.current = createComment;
  }, [createComment]);

  const onStreamingCompleteRef = useRef(onStreamingComplete);
  useEffect(() => {
    onStreamingCompleteRef.current = onStreamingComplete;
  }, [onStreamingComplete]);

  useEffect(() => {
    if (!isStreamingAIReply || !streamingModelId) return;

    // Prevent duplicate requests (e.g., from React StrictMode in development)
    // The ref persists across re-mounts, so the second mount will skip starting a new request
    if (
      streamingStateRef.current.inProgress &&
      streamingStateRef.current.commentId === comment.id
    ) {
      console.log(
        '[AI Reply] Request already in progress, skipping duplicate',
        { commentId: comment.id },
      );
      return;
    }

    // Mark as in progress - this ref is checked when processing chunks/completion
    streamingStateRef.current = {
      inProgress: true,
      commentId: comment.id,
    };

    let accumulatedText = '';

    console.log('[AI Reply] Starting new request', {
      commentId: comment.id,
    });

    const generateAIReply = async () => {
      try {
        setStreamingText('');

        // For root-level AI comments (isRootComment), pass threadId instead of parentCommentId
        // The comment.id is actually the thread ID in this case
        await generateCompletionRef.current(
          {
            communityId: comment.community_id,
            completionType: AICompletionType.Comment,
            ...(isRootComment
              ? { threadId: comment.id }
              : { parentCommentId: comment.id }),
            model: streamingModelId as CompletionModel,
            stream: true,
            webSearchEnabled,
          },
          {
            onChunk: (chunk) => {
              // Check the shared ref state - this works across StrictMode re-mounts
              // because the ref persists and shows the request is still in progress
              if (
                streamingStateRef.current.inProgress &&
                streamingStateRef.current.commentId === comment.id
              ) {
                accumulatedText += chunk;
                setStreamingText(accumulatedText);
              }
            },
            onComplete: async (completedText, commentPayload) => {
              // Check ref state before processing completion
              if (
                !streamingStateRef.current.inProgress ||
                streamingStateRef.current.commentId !== comment.id
              ) {
                return;
              }

              console.log('[AI Reply] onComplete triggered', {
                textLength: completedText?.length,
                hasError: completedText?.startsWith('Error generating reply'),
                commentId: comment.id,
                hasCommentPayload: !!commentPayload,
              });

              // Server creates the AI comment automatically
              if (
                completedText &&
                !completedText.startsWith('Error generating reply')
              ) {
                console.log(
                  '[AI Reply] Completion finished, server created comment',
                  { commentPayload: !!commentPayload },
                );
                setStreamingText('');
              } else {
                console.warn(
                  '[AI Reply] onComplete called with invalid text:',
                  {
                    textLength: completedText?.length,
                    startsWithError: completedText?.startsWith(
                      'Error generating reply',
                    ),
                    text: completedText?.substring(0, 100),
                  },
                );
              }

              // Notify completion with comment payload
              onStreamingCompleteRef.current?.(commentPayload);

              // Reset state
              streamingStateRef.current = {
                inProgress: false,
                commentId: null,
              };
            },
            onError: (error) => {
              if (
                !streamingStateRef.current.inProgress ||
                streamingStateRef.current.commentId !== comment.id
              ) {
                return;
              }

              console.error(
                `Error streaming for model ${streamingModelId}:`,
                error,
              );
              setStreamingText(
                `Error generating reply from ${modelName || 'AI'}.`,
              );

              streamingStateRef.current = {
                inProgress: false,
                commentId: null,
              };
              onStreamingCompleteRef.current?.();
            },
          },
        );
      } catch (error) {
        if (
          streamingStateRef.current.inProgress &&
          streamingStateRef.current.commentId === comment.id
        ) {
          console.error(
            `Error in AI reply process for model ${streamingModelId}:`,
            error,
          );
          setStreamingText(
            `Failed to process reply from ${modelName || 'AI'}.`,
          );

          streamingStateRef.current = {
            inProgress: false,
            commentId: null,
          };
          onStreamingCompleteRef.current?.();
        }
      }
    };

    void generateAIReply();

    // Note: We intentionally do NOT reset the ref on cleanup.
    // This allows the request started by the first mount to continue processing
    // even after StrictMode cleanup, since the second mount will skip starting
    // a new request and the ref will still show "in progress".
  }, [
    isStreamingAIReply,
    streamingModelId,
    modelName,
    comment.id,
    comment.community_id,
    webSearchEnabled,
  ]);

  const displayText = isStreamingAIReply ? streamingText : comment.body;

  const handleReaction = () => {
    setOnReaction((prevOnReaction) => !prevOnReaction);
  };

  const handleVersionHistoryChange = (versionId: number) => {
    const foundVersion = (comment?.CommentVersionHistories || []).find(
      (version) => version.id === versionId,
    );

    if (!foundVersion?.content_url) {
      setCommentText(foundVersion?.body || '');
      setCommentDelta(foundVersion?.body || '');
      return;
    }

    if (contentUrlBodyToFetch === foundVersion.content_url && contentUrlBody) {
      setCommentText(contentUrlBody);
      setCommentDelta(contentUrlBody);
      return;
    }

    setContentUrlBodyToFetch(foundVersion.content_url);
  };

  return (
    <div
      className={clsx('Comment', `comment-${comment.id}`, className, {
        'is-streaming': isStreamingAIReply,
      })}
    >
      <div className="comment-body">
        <div className="comment-header">
          {comment.deleted_at ? (
            <span>[deleted]</span>
          ) : (
            <AuthorAndPublishInfo
              authorAddress={comment?.address}
              authorCommunityId={comment.community_id}
              publishDate={
                isStreamingAIReply
                  ? undefined
                  : comment.created_at
                    ? moment(comment.created_at)
                    : undefined
              }
              discord_meta={comment.discord_meta || undefined}
              popoverPlacement="top"
              showUserAddressWithInfo={false}
              profile={{
                address: comment.address,
                avatarUrl: comment.avatar_url || '',
                name: isStreamingAIReply
                  ? 'AI Assistant'
                  : comment.profile_name || DEFAULT_NAME,
                userId: comment.user_id,
                lastActive: comment.last_active as unknown as string,
                tier: comment.user_tier || UserTierMap.IncompleteUser,
              }}
              versionHistory={(comment.CommentVersionHistories || []).map(
                (cvh) => ({
                  id: cvh.id || 0,
                  thread_id: comment.thread_id,
                  address: comment.address,
                  body: cvh.body,
                  timestamp: cvh.timestamp as unknown as string,
                  content_url: cvh.content_url || '',
                }),
              )}
              shouldShowRole
              onChangeVersionHistoryNumber={handleVersionHistoryChange}
            />
          )}
          {isStreamingAIReply && (
            <div className="streaming-indicator">
              <CWIcon iconName="sparkle" iconSize="small" />
              <CWText type="caption">{modelName || 'AI Assistant'}</CWText>
            </div>
          )}
        </div>
        {isEditing ? (
          <div className="EditComment">
            <ReactQuillEditor
              contentDelta={commentDelta}
              setContentDelta={setCommentDelta}
            />
            <div className="buttons-row">
              <CWButton
                label="Cancel"
                disabled={isSavingEdit}
                buttonType="tertiary"
                onClick={(e) => {
                  e.preventDefault();
                  const hasContentChanged =
                    JSON.stringify(commentBody) !==
                    JSON.stringify(commentDelta);
                  void onEditCancel?.(hasContentChanged);
                }}
              />
              <CWButton
                label="Save"
                buttonWidth="wide"
                disabled={isSavingEdit}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void onEditConfirm?.(commentDelta);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="comment-content">
            {isSpam && <CWTag label="SPAM" type="spam" />}
            <CWText
              className={clsx('comment-text', {
                'streaming-text': isStreamingAIReply,
              })}
            >
              <MarkdownViewerWithFallback markdown={displayText} />
            </CWText>
            {!isStreamingAIReply && !comment.deleted_at && (
              <div className="comment-footer">
                {!hideReactButton && (
                  <CommentReactionButton
                    comment={comment}
                    disabled={!canReact}
                    tooltipText={permissions.CREATE_COMMENT_REACTION.tooltip}
                    onReaction={handleReaction}
                    weightType={weightType}
                    tokenNumDecimals={tokenNumDecimals}
                    tokenSymbol={tokenSymbol}
                  />
                )}

                {viewUpvotesButtonVisible && (
                  <>
                    <ViewUpvotesDrawerTrigger
                      onClick={(e) => {
                        e.preventDefault();
                        setIsUpvoteDrawerOpen(true);
                      }}
                    />
                    <ViewCommentUpvotesDrawer
                      comment={comment}
                      isOpen={isUpvoteDrawerOpen}
                      setIsOpen={setIsUpvoteDrawerOpen}
                      tokenDecimals={tokenNumDecimals}
                      weightType={weightType}
                      tokenSymbol={tokenSymbol}
                    />
                  </>
                )}

                <ShareButton
                  url={shareURL}
                  title={undefined}
                  text="See my comment and join me on Common"
                  shareType="comment"
                  buttonLabel="Share"
                />

                {!isThreadArchived && replyBtnVisible && (
                  <>
                    <CWThreadAction
                      action="reply"
                      label={`Reply${repliesCount ? ` (${repliesCount})` : ''}`}
                      disabled={maxReplyLimitReached || !canReply}
                      tooltipText={
                        permissions.CREATE_COMMENT.tooltip ||
                        (canReply && maxReplyLimitReached
                          ? 'Further replies not allowed'
                          : '')
                      }
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void onReply?.();
                      }}
                    />
                    {isAIEnabled && (
                      <CWThreadAction
                        action="ai-reply"
                        label="AI Reply"
                        disabled={maxReplyLimitReached || !canReply}
                        tooltipText={
                          permissions.CREATE_COMMENT.tooltip ||
                          (canReply && maxReplyLimitReached
                            ? 'Further replies not allowed'
                            : '')
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void onAIReply?.(comment.body);
                        }}
                      />
                    )}
                  </>
                )}

                {user.id > 0 && (
                  <ToggleCommentSubscribe
                    comment={comment}
                    userOwnsComment={userOwnsComment}
                  />
                )}

                {!isThreadArchived &&
                  (canEdit || canDelete || canToggleSpam) && (
                    <PopoverMenu
                      className="CommentActions"
                      renderTrigger={(onClick) => (
                        <CWThreadAction action="overflow" onClick={onClick} />
                      )}
                      // @ts-expect-error <StrictNullChecks/>
                      menuItems={[
                        canEdit && {
                          label: 'Edit',
                          iconLeft: 'notePencil' as const,
                          onClick: onEditStart,
                          iconLeftWeight: 'bold' as const,
                        },
                        canToggleSpam && {
                          onClick: onSpamToggle,
                          label: !isSpam ? 'Flag as spam' : 'Unflag as spam',
                          iconLeft: 'flag' as const,
                          iconLeftWeight: 'bold' as const,
                        },
                        canDelete && {
                          label: 'Delete',
                          iconLeft: 'trash' as const,
                          onClick: onDelete,
                          className: 'danger',
                          iconLeftWeight: 'bold' as const,
                        },
                      ].filter(Boolean)}
                    />
                  )}

                {verifiedCanvasSignedData && (
                  <CWText
                    type="caption"
                    fontWeight="medium"
                    className="verification-icon"
                  >
                    <CWTooltip
                      placement="top"
                      content="Signed by author"
                      renderTrigger={(handleInteraction) => (
                        <span
                          onMouseEnter={handleInteraction}
                          onMouseLeave={handleInteraction}
                        >
                          <CWIcon iconName="check" iconSize="xs" />
                        </span>
                      )}
                    ></CWTooltip>
                  </CWText>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
