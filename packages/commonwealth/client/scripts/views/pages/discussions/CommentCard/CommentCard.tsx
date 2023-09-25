import type Comment from 'models/Comment';
import moment from 'moment';
import type { DeltaStatic } from 'quill';
import React, { useState } from 'react';
import app from 'state';
import { CommentReactionButton } from 'views/components/ReactionButton/CommentReactionButton';
import { PopoverMenu } from 'views/components/component_kit/cw_popover/cw_popover_menu';
import { CWTag } from 'views/components/component_kit/cw_tag';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';
import { ReactQuillEditor } from 'views/components/react_quill_editor';
import { QuillRenderer } from 'views/components/react_quill_editor/quill_renderer';
import { deserializeDelta } from 'views/components/react_quill_editor/utils';
import { SharePopover } from 'views/components/share_popover';
import { AuthorAndPublishInfo } from '../ThreadCard/AuthorAndPublishInfo';

import './CommentCard.scss';

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
  onReply?: () => any;
  canReply?: boolean;
  // Reaction
  canReact?: boolean;
  // Spam
  isSpam?: boolean;
  onSpamToggle?: () => any;
  canToggleSpam?: boolean;
  // actual comment
  comment: Comment<any>;
  isSubscribed?: (comment: Comment<any>) => boolean;
  handleToggleSubscribe?: (comment: Comment<any>) => Promise<void>;
  hasJoinedCommunity?: boolean;
  isCommentAuthor?: boolean;
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
  onReply,
  canReply,
  // reaction
  canReact,
  // spam
  isSpam,
  onSpamToggle,
  canToggleSpam,
  // actual comment
  comment,
  isSubscribed,
  handleToggleSubscribe,
  hasJoinedCommunity,
  isCommentAuthor,
}: CommentCardProps) => {
  const commentBody = deserializeDelta(editDraft || comment.text);
  const [commentDelta, setCommentDelta] = useState<DeltaStatic>(commentBody);
  const author = app.chain.accounts.get(comment.author);

  return (
    <div className="comment-body">
      <div className="comment-header">
        {comment.deleted ? (
          <span>[deleted]</span>
        ) : (
          <AuthorAndPublishInfo
            authorAddress={author.address}
            authorChainId={author.chain?.id || author?.profile?.chain}
            publishDate={moment(comment.createdAt).format('l')}
            discord_meta={comment.discord_meta}
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
          {isSpam && <CWTag label="SPAM" type="disabled" />}
          <CWText className="comment-text">
            <QuillRenderer doc={comment.text} />
          </CWText>
          {!comment.deleted && (
            <div className="comment-footer">
              <CommentReactionButton comment={comment} disabled={!canReact} />

              <SharePopover commentId={comment.id} />

              {replyBtnVisible && (
                <CWThreadAction
                  action="reply"
                  disabled={!canReply}
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await onReply();
                  }}
                />
              )}

              {isCommentAuthor && (
                <CWThreadAction
                  action="subscribe"
                  onClick={() => handleToggleSubscribe(comment)}
                  selected={!isSubscribed(comment)}
                  label={isSubscribed(comment) ? 'Unsubscribe' : 'Subscribe'}
                  disabled={!hasJoinedCommunity}
                />
              )}

              {(canEdit || canDelete) && (
                <PopoverMenu
                  className="CommentActions"
                  renderTrigger={(onClick) => (
                    <CWThreadAction action="overflow" onClick={onClick} />
                  )}
                  menuItems={[
                    canEdit && {
                      label: 'Edit',
                      iconLeft: 'write' as const,
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};
