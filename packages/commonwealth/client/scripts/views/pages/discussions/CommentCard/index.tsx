import moment from 'moment';
import type { DeltaStatic } from 'quill';
import React, { useState } from 'react';
import app from 'state';
import type Comment from '../../../../models/Comment';
import { CWButton } from '../../../components/component_kit/cw_button';
import { CWIcon } from '../../../components/component_kit/cw_icons/cw_icon';
import { PopoverMenu } from '../../../components/component_kit/cw_popover/cw_popover_menu';
import { CWText } from '../../../components/component_kit/cw_text';
import { CWTag } from '../../../components/component_kit/cw_tag';
import { CommentReactionButton } from '../../../components/ReactionButton/CommentReactionButton';
import { ReactQuillEditor } from '../../../components/react_quill_editor';
import { QuillRenderer } from '../../../components/react_quill_editor/quill_renderer';
import { deserializeDelta } from '../../../components/react_quill_editor/utils';
import { SharePopover } from '../../../components/share_popover';
import { AuthorAndPublishInfo } from '../ThreadCard/AuthorAndPublishInfo';
import './index.scss';

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
  canReply?: boolean;
  onReply?: () => any;
  // Spam
  isSpam?: boolean;
  onSpamToggle?: () => any;
  canToggleSpam?: boolean;
  // actual comment
  comment: Comment<any>;
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
  canReply,
  onReply,
  // spam
  isSpam,
  onSpamToggle,
  canToggleSpam,
  // actual comment
  comment,
}: CommentCardProps) => {
  const commentBody = deserializeDelta(editDraft || comment.text);
  const [commentDelta, setCommentDelta] = useState<DeltaStatic>(commentBody);

  return (
    <div className="comment-body">
      <div className="comment-header">
        {comment.deleted ? (
          <span>[deleted]</span>
        ) : (
          <AuthorAndPublishInfo
            authorInfo={app.chain.accounts.get(comment.author)}
            publishDate={moment(comment.createdAt).format('l')}
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
              buttonType="secondary-blue"
              onClick={async (e) => {
                e.preventDefault();
                const hasContentChanged =
                  JSON.stringify(commentBody) !== JSON.stringify(commentDelta);
                onEditCancel(hasContentChanged);
              }}
            />
            <CWButton
              label="Save"
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
              <CommentReactionButton comment={comment} />

              <SharePopover
                commentId={comment.id}
                renderTrigger={(onClick) => (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onClick(e);
                    }}
                    className="comment-option-btn"
                  >
                    <CWIcon
                      color="black"
                      iconName="share"
                      iconSize="small"
                      weight="fill"
                    />
                    <CWText type="caption">Share</CWText>
                  </button>
                )}
              />

              {canReply && (
                <button
                  onClick={async (e) => {
                    // prevent clicks from propagating to discussion row
                    e.preventDefault();
                    e.stopPropagation();
                    await onReply();
                  }}
                  className="comment-option-btn"
                >
                  <CWIcon iconName="comment" iconSize="small" />
                  <CWText type="caption" className="menu-buttons-text">
                    Reply
                  </CWText>
                </button>
              )}

              {(canEdit || canDelete) && (
                <PopoverMenu
                  renderTrigger={(onclick) => (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onclick(e);
                      }}
                      className="comment-option-btn"
                    >
                      <CWIcon iconName="dots" iconSize="small" />
                    </button>
                  )}
                  menuItems={[
                    canEdit && {
                      label: 'Edit',
                      iconLeft: 'write' as any,
                      onClick: onEditStart,
                    },
                    canToggleSpam &&
                      !isSpam && {
                        onClick: onSpamToggle,
                        label: 'Flag as spam',
                        iconLeft: 'flag' as const,
                        iconLeftWeight: 'bold',
                      },
                    canDelete && {
                      label: 'Delete',
                      iconLeft: 'trash' as any,
                      onClick: onDelete,
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
