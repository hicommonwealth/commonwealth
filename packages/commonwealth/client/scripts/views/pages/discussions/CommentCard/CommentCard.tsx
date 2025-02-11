import type { DeltaStatic } from 'quill';
import React, { useEffect, useRef, useState } from 'react';

import { CommentsView } from '@hicommonwealth/schemas';
import {
  CanvasSignedData,
  DEFAULT_NAME,
  deserializeCanvas,
  verify,
} from '@hicommonwealth/shared';
import clsx from 'clsx';
import { GetThreadActionTooltipTextResponse } from 'helpers/threads';
import { useGenerateCommentText } from 'hooks/useGenerateCommentText';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import moment from 'moment';
import { useCreateCommentMutation } from 'state/api/comments';
import { buildCreateCommentInput } from 'state/api/comments/createComment';
import useGetContentByUrlQuery from 'state/api/general/getContentByUrl';
import useUserStore from 'state/ui/user';
import { MarkdownViewerWithFallback } from 'views/components/MarkdownViewerWithFallback/MarkdownViewerWithFallback';
import { CommentReactionButton } from 'views/components/ReactionButton/CommentReactionButton';
import { SharePopover } from 'views/components/SharePopover';
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
import { useAiToggleState } from '../../../../hooks/useAiToggleState';
import { AuthorAndPublishInfo } from '../ThreadCard/AuthorAndPublishInfo';
import './CommentCard.scss';
import { ToggleCommentSubscribe } from './ToggleCommentSubscribe';

export type CommentViewParams = z.infer<typeof CommentsView>;

type CommentCardProps = {
  disabledActionsTooltipText?: GetThreadActionTooltipTextResponse;
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
  onAIReply?: () => Promise<void>;
  // AI streaming props
  isStreamingAIReply?: boolean;
  parentCommentText?: string;
  onStreamingComplete?: () => void;
};

export const CommentCard = ({
  disabledActionsTooltipText = '',
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
  onAIReply,
  isStreamingAIReply,
  parentCommentText,
  onStreamingComplete,
}: CommentCardProps) => {
  const user = useUserStore();
  const userOwnsComment = comment.user_id === user.id;
  const [streamingText, setStreamingText] = useState('');
  const { generateComment } = useGenerateCommentText();
  const { aiCommentsFeatureEnabled } = useAiToggleState();
  const { mutateAsync: createComment } = useCreateCommentMutation({
    threadId: comment.thread_id,
    communityId: comment.community_id,
    existingNumberOfComments: 0,
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

  const generateCommentRef = useRef(generateComment);
  useEffect(() => {
    generateCommentRef.current = generateComment;
  }, [generateComment]);

  const onStreamingCompleteRef = useRef(onStreamingComplete);
  useEffect(() => {
    onStreamingCompleteRef.current = onStreamingComplete;
  }, [onStreamingComplete]);

  const activeUserAddress = user.activeAccount?.address;

  useEffect(() => {
    if (!isStreamingAIReply || !parentCommentText) return;

    let mounted = true;
    let finalText = '';
    let accumulatedText = '';

    const generateAIReply = async () => {
      try {
        const actualParentId = Number(comment.id);
        if (actualParentId <= 0) {
          console.error('Invalid parent ID:', actualParentId);
          throw new Error('Invalid parent comment ID');
        }

        await generateCommentRef.current(parentCommentText, (text) => {
          if (mounted) {
            // Append incoming chunks so the full comment is built up
            accumulatedText += text;
            setStreamingText(accumulatedText);
            finalText = accumulatedText;
          }
        });

        if (mounted && finalText) {
          if (!activeUserAddress) {
            console.error(
              'No active account found: activeUserAddress is undefined',
            );
            throw new Error('No active account found');
          }

          const input = await buildCreateCommentInput({
            communityId: comment.community_id,
            address: activeUserAddress,
            threadId: comment.thread_id,
            threadMsgId: null,
            unescapedText: finalText,
            parentCommentId: actualParentId,
            parentCommentMsgId: null,
            existingNumberOfComments: 0,
          });

          await createCommentRef.current(input);
          onStreamingCompleteRef.current?.();
        }
      } catch (error) {
        console.error('Failed to generate AI reply:', error);
        if (mounted) {
          onStreamingCompleteRef.current?.();
        }
      }
    };

    void generateAIReply();
    return () => {
      mounted = false;
    };
  }, [
    isStreamingAIReply,
    parentCommentText,
    comment.id,
    comment.thread_id,
    comment.community_id,
    activeUserAddress,
  ]);

  useEffect(() => {
    if (isStreamingAIReply) {
      setStreamingText('');
    }
  }, [isStreamingAIReply]);

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
                name: comment.profile_name || DEFAULT_NAME,
                userId: comment.user_id,
                lastActive: comment.last_active as unknown as string,
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
              onChangeVersionHistoryNumber={handleVersionHistoryChange}
            />
          )}
          {isStreamingAIReply && (
            <div className="streaming-indicator">
              <CWIcon iconName="sparkle" iconSize="small" />
              <CWText type="caption">AI Assistant</CWText>
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
                    tooltipText={
                      typeof disabledActionsTooltipText === 'function'
                        ? disabledActionsTooltipText?.('upvote')
                        : disabledActionsTooltipText
                    }
                    onReaction={handleReaction}
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
                    />
                  </>
                )}

                <SharePopover linkToShare={shareURL} buttonLabel="Share" />

                {!isThreadArchived && replyBtnVisible && (
                  <>
                    <CWThreadAction
                      action="reply"
                      label={`Reply${repliesCount ? ` (${repliesCount})` : ''}`}
                      disabled={maxReplyLimitReached || !canReply}
                      tooltipText={
                        (typeof disabledActionsTooltipText === 'function'
                          ? disabledActionsTooltipText?.('reply')
                          : disabledActionsTooltipText) ||
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
                    {aiCommentsFeatureEnabled && (
                      <CWThreadAction
                        action="ai-reply"
                        label="AI Reply"
                        disabled={maxReplyLimitReached || !canReply}
                        tooltipText={
                          (typeof disabledActionsTooltipText === 'function'
                            ? disabledActionsTooltipText?.('reply')
                            : disabledActionsTooltipText) ||
                          (canReply && maxReplyLimitReached
                            ? 'Further replies not allowed'
                            : '')
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void onAIReply?.();
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
