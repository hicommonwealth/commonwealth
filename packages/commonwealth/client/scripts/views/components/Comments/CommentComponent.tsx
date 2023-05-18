import React, { useState, useEffect } from 'react';

import 'components/Comments/Comment.scss';
import moment from 'moment';
import type { Action, Session } from '@canvas-js/interfaces';

import app from 'state';
import { ContentType } from 'types';
import { notifyError } from '../../../controllers/app/notifications';
import type Comment from '../../../models/Comment';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { PopoverMenu } from '../component_kit/cw_popover/cw_popover_menu';
import { CWText } from '../component_kit/cw_text';
import { Modal as CWModal } from '../component_kit/cw_modal';
import { CommentReactionButton } from '../reaction_button/comment_reaction_button';
import { SharePopover } from '../share_popover';
import { EditComment } from './EditComment';
import { clearEditingLocalStorage } from './helpers';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { QuillRenderer } from '../react_quill_editor/quill_renderer';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { CanvasVerifyDataModal } from '../../modals/canvas_verify_data_modal';
import { verify } from 'canvas';

import CommentAuthor from 'views/components/Comments/CommentAuthor';

type CommentProps = {
  comment: Comment<any>;
  handleIsReplying: (isReplying: boolean, id?: number) => void;
  isGloballyEditing?: boolean;
  isLast: boolean;
  isLocked: boolean;
  setIsGloballyEditing: (status: boolean) => void;
  threadLevel: number;
  updatedCommentsCallback?: () => void;
};

export const CommentComponent = ({
  comment,
  handleIsReplying,
  isLast,
  isLocked,
  setIsGloballyEditing,
  threadLevel,
  updatedCommentsCallback,
}: CommentProps) => {
  const [isCanvasVerifyModalVisible, setIsCanvasVerifyDataModalVisible] =
    React.useState<boolean>(false);
  const [verifiedAction, setVerifiedAction] = React.useState<Action>();
  const [verifiedSession, setVerifiedSession] = React.useState<Session>();

  const [isEditingComment, setIsEditingComment] =
    React.useState<boolean>(false);
  const [shouldRestoreEdits, setShouldRestoreEdits] =
    React.useState<boolean>(false);
  const [savedEdits, setSavedEdits] = React.useState<string>('');

  const { isLoggedIn } = useUserLoggedIn();

  const handleSetIsEditingComment = (status: boolean) => {
    setIsGloballyEditing(status);
    setIsEditingComment(status);
  };

  const isAdminOrMod =
    app.user.isSiteAdmin ||
    app.roles.isRoleOfCommunity({
      role: 'admin',
      chain: app.activeChainId(),
    }) ||
    app.roles.isRoleOfCommunity({
      role: 'moderator',
      chain: app.activeChainId(),
    });

  const canReply = !isLast && !isLocked && isLoggedIn && app.user.activeAccount;

  const canEditAndDelete =
    !isLocked &&
    (comment.author === app.user.activeAccount?.address || isAdminOrMod);

  const handleDeleteComment = () => {
    openConfirmation({
      title: 'Delete Comment',
      description: <>Delete this comment?</>,
      buttons: [
        {
          label: 'Delete',
          buttonType: 'mini-red',
          onClick: async () => {
            try {
              await app.comments.delete(comment);
              updatedCommentsCallback();
            } catch (e) {
              console.log(e);
              notifyError('Failed to delete comment.');
            }
          },
        },
        {
          label: 'Cancel',
          buttonType: 'mini-black',
        },
      ],
    });
  };

  useEffect(() => {
    try {
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
        .then((result) => setVerifiedSession(session))
        .catch((err) => console.log('Could not verify session'));
      verify({ action, actionSignerAddress })
        .then((result) => setVerifiedAction(action))
        .catch((err) => console.log('Could not verify action'));
    } catch (err) {
      console.log('Unexpected error while verifying action/session');
      return;
    }
  }, []);

  return (
    <div className={`Comment comment-${comment.id}`}>
      {threadLevel > 0 && (
        <div className="thread-connectors-container">
          {Array(threadLevel)
            .fill(undefined)
            .map((_, i) => (
              <div key={i} className="thread-connector" />
            ))}
        </div>
      )}
      <div className="comment-body">
        <div className="comment-header">
          <CommentAuthor comment={comment} />
          <CWText
            key={comment.id}
            type="caption"
            fontWeight="medium"
            className="published-text"
          >
            {moment(comment.createdAt).format('l')}
          </CWText>
        </div>
        {isEditingComment ? (
          <EditComment
            comment={comment}
            savedEdits={savedEdits}
            setIsEditing={handleSetIsEditingComment}
            shouldRestoreEdits={shouldRestoreEdits}
            updatedCommentsCallback={updatedCommentsCallback}
          />
        ) : (
          <>
            <CWText className="comment-text">
              <QuillRenderer doc={comment.text} />
            </CWText>
            {!comment.deleted && (
              <div className="comment-footer">
                <div className="menu-buttons-left">
                  <CommentReactionButton comment={comment} />
                  {canReply && (
                    <div
                      className="reply-button"
                      onClick={() => {
                        handleIsReplying(true, comment.id);
                      }}
                    >
                      <CWIcon iconName="feedback" iconSize="small" />
                      <CWText type="caption" className="menu-buttons-text">
                        Reply
                      </CWText>
                    </div>
                  )}
                  {isCanvasVerifyModalVisible && (
                    <CWModal
                      content={<CanvasVerifyDataModal obj={comment} />}
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
                <div className="menu-buttons-right">
                  <SharePopover commentId={comment.id} />
                  {canEditAndDelete && (
                    <PopoverMenu
                      renderTrigger={(onclick) => (
                        <CWIconButton
                          iconName="dotsVertical"
                          iconSize="small"
                          onClick={onclick}
                        />
                      )}
                      menuItems={[
                        {
                          label: 'Edit',
                          iconLeft: 'write',
                          onClick: async (e) => {
                            e.preventDefault();
                            const editsToSave = localStorage.getItem(
                              `${app.activeChainId()}-edit-comment-${
                                comment.id
                              }-storedText`
                            );

                            if (editsToSave) {
                              clearEditingLocalStorage(
                                comment.id,
                                ContentType.Comment
                              );

                              setSavedEdits(editsToSave || '');

                              openConfirmation({
                                title: 'Info',
                                description: (
                                  <>Previous changes found. Restore edits?</>
                                ),
                                buttons: [
                                  {
                                    label: 'Restore',
                                    buttonType: 'mini-black',
                                    onClick: () => {
                                      setShouldRestoreEdits(true);
                                      handleSetIsEditingComment(true);
                                    },
                                  },
                                  {
                                    label: 'Cancel',
                                    buttonType: 'mini-white',
                                    onClick: () =>
                                      handleSetIsEditingComment(true),
                                  },
                                ],
                              });
                            } else {
                              handleSetIsEditingComment(true);
                            }
                          },
                        },
                        {
                          label: 'Delete',
                          iconLeft: 'trash',
                          onClick: handleDeleteComment,
                        },
                      ]}
                    />
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
