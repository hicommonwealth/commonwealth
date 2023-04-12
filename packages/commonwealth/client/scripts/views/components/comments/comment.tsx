import React, { useState } from 'react';

import 'components/comments/comment.scss';
import type { Account, Comment as CommentType } from 'models';
import moment from 'moment';

import app from 'state';
import { ContentType } from 'types';
import { ChainType } from '../../../../../../common-common/src/types';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { PopoverMenu } from '../component_kit/cw_popover/cw_popover_menu';
import { CWText } from '../component_kit/cw_text';
import { renderQuillTextBody } from '../quill/helpers';
import { CommentReactionButton } from '../reaction_button/comment_reaction_button';
import { SharePopover } from '../share_popover';
import { User } from '../user/user';
import { EditComment } from './edit_comment';
import { clearEditingLocalStorage } from './helpers';
import { AnonymousUser } from '../user/anonymous_user';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { QuillRenderer } from '../react_quill_editor/quill_renderer';
import { CanvasVerifyDataModal } from '../../modals/canvas_verify_data_modal';
import { verify } from 'canvas';

type CommentAuthorProps = {
  comment: CommentType<any>;
};

const CommentAuthor = (props: CommentAuthorProps) => {
  const { comment } = props;

  // Check for accounts on forums that originally signed up on a different base chain,
  // Render them as anonymous as the forum is unable to support them.
  if (app.chain.meta.type === ChainType.Offchain) {
    if (
      comment.authorChain !== app.chain.id &&
      comment.authorChain !== app.chain.base
    ) {
      return <AnonymousUser distinguishingKey={comment.author} />;
    }
  }

  const author: Account = app.chain.accounts.get(comment.author);

  return comment.deleted ? (
    <span>[deleted]</span>
  ) : (
    <User avatarSize={24} user={author} popover linkify />
  );
};

type CommentProps = {
  comment: CommentType<any>;
  handleIsReplying: (isReplying: boolean, id?: number) => void;
  isGloballyEditing?: boolean;
  isLast: boolean;
  isLocked: boolean;
  setIsGloballyEditing: (status: boolean) => void;
  threadLevel: number;
  updatedCommentsCallback?: () => void;
};

export const Comment = (props: CommentProps) => {
  const {
    comment,
    handleIsReplying,
    isLast,
    isLocked,
    setIsGloballyEditing,
    threadLevel,
    updatedCommentsCallback,
  } = props;

  const [isCanvasVerifyModalVisible, setIsCanvasVerifyModalVisible] =
    React.useState<boolean>(false);
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

  const canReply =
    !isLast && !isLocked && isLoggedIn && app.user.activeAccount;

  const canEditAndDelete =
    !isLocked &&
    (comment.author === app.user.activeAccount?.address || isAdminOrMod);

  const deleteComment = async () => {
    await app.comments.delete(comment);
    updatedCommentsCallback();
  };

    if (!this.verificationChecked) {
      this.verificationChecked = true;
      try {
        const session = JSON.parse(comment.canvasSession);
        const action = JSON.parse(comment.canvasAction);
        const actionSignerAddress = session?.payload?.sessionAddress;
        if (
          !comment.canvasSession ||
          !comment.canvasAction ||
          !actionSignerAddress
        )
          return;
        verify({ session })
          .then((result) => (this.verifiedSession = true))
          .catch((err) => console.log('Could not verify session'))
          .finally(() => m.redraw());
        verify({ action, actionSignerAddress })
          .then((result) => (this.verifiedAction = true))
          .catch((err) => console.log('Could not verify action'))
          .finally(() => m.redraw());
      } catch (err) {
        console.log('Unexpected error while verifying action/session');
        return;
      }
    }

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
          {/* don't need this distinction yet since we aren't showing "edited at" */}
          {/* <CWText type="caption" className="published-text">
              published on
            </CWText> */}
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
              {this.isCanvasVerifyModalVisible && <Modal
	             content={<CanvasVerifyDataModal obj={comment} />}
               onClose={() => setIsCanvasVerifyModalVisible(false)}
               open={isCanvasVerifyModalVisible}
                />}
              {this.verifiedAction && this.verifiedSession && (
                <CWText
                type="caption"
                fontWeight="medium"
                className="verification-icon"
                onclick={() => setIsCanvasVerifyModalVisible(true)}
                  >
                  <CWIcon iconName="checkCircle" iconSize="xs" />
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
                            setSavedEdits(
                              localStorage.getItem(
                                `${app.activeChainId()}-edit-comment-${
                                  comment.id
                                }-storedText`
                              )
                            );
                            if (savedEdits) {
                              clearEditingLocalStorage(
                                comment.id,
                                ContentType.Comment
                              );

                              const confirmationResult = window.confirm(
                                'Previous changes found. Restore edits?'
                              );

                              setShouldRestoreEdits(confirmationResult);
                            }
                            handleSetIsEditingComment(true);
                          },
                        },
                        {
                          label: 'Delete',
                          iconLeft: 'trash',
                          onClick: deleteComment,
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
