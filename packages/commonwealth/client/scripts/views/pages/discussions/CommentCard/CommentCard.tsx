import type { DeltaStatic } from 'quill';
import React, { useEffect, useState } from 'react';
import app from 'state';

import {
  CanvasSignedData,
  deserializeCanvas,
  verify,
} from '@hicommonwealth/shared';
import { GetThreadActionTooltipTextResponse } from 'client/scripts/helpers/threads';
import { SharePopover } from 'client/scripts/views/components/SharePopover';
import {
  ViewCommentUpvotesDrawer,
  ViewUpvotesDrawerTrigger,
} from 'client/scripts/views/components/UpvoteDrawer';
import clsx from 'clsx';
import type Comment from 'models/Comment';
import useUserStore from 'state/ui/user';
import { MarkdownViewerWithFallback } from 'views/components/MarkdownViewerWithFallback/MarkdownViewerWithFallback';
import { CommentReactionButton } from 'views/components/ReactionButton/CommentReactionButton';
import { PopoverMenu } from 'views/components/component_kit/CWPopoverMenu';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';
import { ReactQuillEditor } from 'views/components/react_quill_editor';
import { deserializeDelta } from 'views/components/react_quill_editor/utils';
import { ToggleCommentSubscribe } from 'views/pages/discussions/CommentCard/ToggleCommentSubscribe';
import { AuthorAndPublishInfo } from '../ThreadCard/AuthorAndPublishInfo';
import './CommentCard.scss';

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
  comment: Comment<any>;
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
  const userOwnsComment = comment.profile.userId === user.id;

  const [commentText, setCommentText] = useState(comment.text);
  const commentBody = deserializeDelta(
    (editDraft || commentText) ?? comment.text,
  );
  const [commentDelta, setCommentDelta] = useState<DeltaStatic>(commentBody);
  const author =
    comment?.author && app?.chain?.accounts
      ? app.chain.accounts.get(comment?.author)
      : null;

  const [verifiedCanvasSignedData, setVerifiedCanvasSignedData] =
    useState<CanvasSignedData | null>(null);
  const [, setOnReaction] = useState<boolean>(false);
  const [isUpvoteDrawerOpen, setIsUpvoteDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const canvasSignedData: CanvasSignedData = deserializeCanvas(
        comment.canvasSignedData,
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
  }, [comment.canvasSignedData]);

  const handleReaction = () => {
    setOnReaction((prevOnReaction) => !prevOnReaction);
  };

  return (
    <div className={clsx('comment-body', className)}>
      <div className="comment-header">
        {comment.deleted ? (
          <span>[deleted]</span>
        ) : (
          <AuthorAndPublishInfo
            // @ts-expect-error <StrictNullChecks/>
            authorAddress={app.chain ? author?.address : comment?.author}
            // @ts-expect-error <StrictNullChecks/>
            authorCommunityId={
              author?.community?.id ||
              author?.profile?.chain ||
              comment?.communityId ||
              comment?.authorChain
            }
            publishDate={comment.createdAt}
            discord_meta={comment.discord_meta}
            popoverPlacement="top"
            showUserAddressWithInfo={false}
            profile={comment.profile}
            versionHistory={comment.versionHistory}
            changeContentText={setCommentText}
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
                  JSON.stringify(commentBody) !== JSON.stringify(commentDelta);

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
          {!comment.deleted && (
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
                  label="Reply"
                  disabled={maxReplyLimitReached || !canReply}
                  tooltipText={
                    (typeof disabledActionsTooltipText === 'function'
                      ? disabledActionsTooltipText?.('reply')
                      : disabledActionsTooltipText) ||
                    (canReply && maxReplyLimitReached
                      ? 'Nested reply limit reached'
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

              {!isThreadArchived && (canEdit || canDelete || canToggleSpam) && (
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
  );
};
