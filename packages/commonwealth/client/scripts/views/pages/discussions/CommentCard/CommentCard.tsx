import type { Action, Session } from '@canvas-js/interfaces';
import { verify } from 'canvas';
import type { DeltaStatic } from 'quill';
import React, { useEffect, useState } from 'react';
import app from 'state';

import {
  ViewCommentUpvotesDrawer,
  ViewUpvotesDrawerTrigger,
} from 'client/scripts/views/components/UpvoteDrawer';
import type Comment from 'models/Comment';
import { CommentReactionButton } from 'views/components/ReactionButton/CommentReactionButton';
import { PopoverMenu } from 'views/components/component_kit/CWPopoverMenu';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';
import { ReactQuillEditor } from 'views/components/react_quill_editor';
import { QuillRenderer } from 'views/components/react_quill_editor/quill_renderer';
import { deserializeDelta } from 'views/components/react_quill_editor/utils';
import { SharePopover } from 'views/components/share_popover';
import { CanvasVerifyDataModal } from 'views/modals/canvas_verify_data_modal';
import { AuthorAndPublishInfo } from '../ThreadCard/AuthorAndPublishInfo';
import './CommentCard.scss';

type CommentCardProps = {
  disabledActionsTooltipText?: string;
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
  // Spam
  isSpam?: boolean;
  onSpamToggle?: () => any;
  canToggleSpam?: boolean;
  // actual comment
  comment: Comment<any>;
  isThreadArchived: boolean;
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
  // spam
  isSpam,
  onSpamToggle,
  canToggleSpam,
  // actual comment
  comment,
  isThreadArchived,
}: CommentCardProps) => {
  const commentBody = deserializeDelta(editDraft || comment.text);
  const [commentDelta, setCommentDelta] = useState<DeltaStatic>(commentBody);
  const author = comment?.author
    ? app.chain.accounts.get(comment?.author)
    : null;

  const [isCanvasVerifyModalVisible, setIsCanvasVerifyDataModalVisible] =
    useState<boolean>(false);
  const [verifiedAction, setVerifiedAction] = useState<Action>();
  const [verifiedSession, setVerifiedSession] = useState<Session>();
  const [, setOnReaction] = useState<boolean>(false);
  const [isUpvoteDrawerOpen, setIsUpvoteDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      // suppress "unexpected error while verifying" error message on non-synced comments
      if (!comment.canvasSession || !comment.canvasAction) return;
      const session: Session = JSON.parse(comment.canvasSession);
      const action: Action = JSON.parse(comment.canvasAction);
      const actionSignerAddress = session?.payload?.sessionAddress;
      if (
        !comment.canvasSession ||
        !comment.canvasAction ||
        !actionSignerAddress
      )
        return;
      verify({ session })
        .then(() => setVerifiedSession(session))
        .catch((err) => console.log('Could not verify session', err.stack));
      verify({ action, actionSignerAddress })
        .then(() => setVerifiedAction(action))
        .catch((err) => console.log('Could not verify action', err.stack));
    } catch (err) {
      console.log('Unexpected error while verifying action/session');
      return;
    }
  }, [comment.canvasAction, comment.canvasSession]);

  const handleReaction = () => {
    setOnReaction((prevOnReaction) => !prevOnReaction);
  };

  return (
    <div className="comment-body">
      <div className="comment-header">
        {comment.deleted ? (
          <span>[deleted]</span>
        ) : (
          <AuthorAndPublishInfo
            authorAddress={author?.address}
            authorCommunityId={author?.community?.id || author?.profile?.chain}
            publishDate={comment.createdAt}
            discord_meta={comment.discord_meta}
            popoverPlacement="top"
            showUserAddressWithInfo={false}
            profile={comment.profile}
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
                await onEditConfirm(commentDelta);
              }}
            />
          </div>
        </div>
      ) : (
        <div className="comment-content">
          {isSpam && <CWTag label="SPAM" type="spam" />}
          <CWText className="comment-text">
            <QuillRenderer doc={comment.text} />
          </CWText>
          {!comment.deleted && (
            <div className="comment-footer">
              <CommentReactionButton
                comment={comment}
                disabled={!canReact}
                tooltipText={
                  disabledActionsTooltipText ? 'Join community to upvote' : ''
                }
                onReaction={handleReaction}
              />

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

              <SharePopover commentId={comment.id} />

              {!isThreadArchived && replyBtnVisible && (
                <CWThreadAction
                  action="reply"
                  label="Reply"
                  disabled={maxReplyLimitReached || !canReply}
                  tooltipText={
                    disabledActionsTooltipText
                      ? 'Join community to reply'
                      : canReply && maxReplyLimitReached
                      ? 'Nested reply limit reached'
                      : ''
                  }
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await onReply();
                  }}
                />
              )}

              {!isThreadArchived && (canEdit || canDelete) && (
                <PopoverMenu
                  className="CommentActions"
                  renderTrigger={(onClick) => (
                    <CWThreadAction action="overflow" onClick={onClick} />
                  )}
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

              {isCanvasVerifyModalVisible && (
                <CWModal
                  size="medium"
                  content={
                    <CanvasVerifyDataModal
                      obj={comment}
                      onClose={() => setIsCanvasVerifyDataModalVisible(false)}
                    />
                  }
                  onClose={() => setIsCanvasVerifyDataModalVisible(false)}
                  open={isCanvasVerifyModalVisible}
                />
              )}
              {verifiedAction && verifiedSession && (
                <CWText
                  type="caption"
                  fontWeight="medium"
                  className="verification-icon"
                  onClick={() => setIsCanvasVerifyDataModalVisible(true)}
                >
                  <CWIcon iconName="check" iconSize="xs" />
                </CWText>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
