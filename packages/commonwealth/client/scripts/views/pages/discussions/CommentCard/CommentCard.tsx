import type { DeltaStatic } from 'quill';
import React, { useEffect, useState } from 'react';

import { CommentsView } from '@hicommonwealth/schemas';
import {
  CanvasSignedData,
  DEFAULT_NAME,
  deserializeCanvas,
  verify,
} from '@hicommonwealth/shared';
import clsx from 'clsx';
import { GetThreadActionTooltipTextResponse } from 'helpers/threads';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import moment from 'moment';
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
}: CommentCardProps) => {
  const user = useUserStore();
  const userOwnsComment = comment.user_id === user.id;

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
    <div className={clsx('Comment', `comment-${comment.id}`, className)}>
      <div className="comment-body">
        <div className="comment-header">
          {comment.deleted_at ? (
            <span>[deleted]</span>
          ) : (
            <AuthorAndPublishInfo
              authorAddress={comment?.address}
              authorCommunityId={comment.community_id}
              publishDate={
                comment.created_at ? moment(comment.created_at) : undefined
              }
              discord_meta={comment.discord_meta || undefined}
              popoverPlacement="top"
              showUserAddressWithInfo={false}
              profile={{
                address: comment.address,
                avatarUrl: comment.profile_avatar || '',
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
                onClick={async (e) => {
                  e.preventDefault();
                  const hasContentChanged =
                    JSON.stringify(commentBody) !==
                    JSON.stringify(commentDelta);

                  // @ts-expect-error <StrictNullChecks/>
                  onEditCancel(hasContentChanged);
                }}
              />
              <CWButton
                label="Save"
                buttonWidth="wide"
                disabled={isSavingEdit}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // @ts-expect-error <StrictNullChecks/>
                  await onEditConfirm(commentDelta);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="comment-content">
            {isSpam && <CWTag label="SPAM" type="spam" />}
            <CWText className="comment-text">
              <MarkdownViewerWithFallback markdown={commentText} />
            </CWText>
            {!comment.deleted_at && (
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
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // @ts-expect-error <StrictNullChecks/>
                      await onReply();
                    }}
                  />
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
