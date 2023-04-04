/* @jsx m */

import ClassComponent from 'class_component';

import 'components/comments/comment.scss';
import m from 'mithril';
import type { Account, Comment as CommentType } from 'models';
import moment from 'moment';

import app from 'state';
import { ContentType } from 'types';
import { ChainType } from '../../../../../../common-common/src/types';
import { confirmationModalWithText } from '../../modals/confirm_modal';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWPopoverMenu } from '../component_kit/cw_popover/cw_popover_menu';
import { CWText } from '../component_kit/cw_text';
import { renderQuillTextBody } from '../quill/helpers';
import { CommentReactionButton } from '../reaction_button/comment_reaction_button';
import { SharePopover } from '../share_popover';
import User, { AnonymousUser } from '../widgets/user';
import { EditComment } from './edit_comment';
import { clearEditingLocalStorage } from './helpers';
import { showCanvasVerifyDataModal } from '../../modals/canvas_verify_data_modal';
import { verify } from 'canvas';

type CommentAuthorAttrs = {
  comment: CommentType<any>;
};

class CommentAuthor extends ClassComponent<CommentAuthorAttrs> {
  view(vnode: m.Vnode<CommentAuthorAttrs>) {
    const { comment } = vnode.attrs;

    // Check for accounts on forums that originally signed up on a different base chain,
    // Render them as anonymous as the forum is unable to support them.
    if (app.chain.meta.type === ChainType.Offchain) {
      if (
        comment.authorChain !== app.chain.id &&
        comment.authorChain !== app.chain.base
      ) {
        return m(AnonymousUser, {
          distinguishingKey: comment.author,
        });
      }
    }

    const author: Account = app.chain.accounts.get(comment.author);

    return comment.deleted ? (
      <span>[deleted]</span>
    ) : (
      m(User, {
        avatarSize: 24,
        user: author,
        popover: true,
        linkify: true,
      })
    );
  }
}

type CommentAttrs = {
  comment: CommentType<any>;
  handleIsReplying: (isReplying: boolean, id?: number) => void;
  isGloballyEditing?: boolean;
  isLast: boolean;
  isLocked: boolean;
  setIsGloballyEditing: (status: boolean) => void;
  threadLevel: number;
  updatedCommentsCallback?: () => void;
};

export class Comment extends ClassComponent<CommentAttrs> {
  private isEditingComment: boolean;
  private shouldRestoreEdits: boolean;
  private savedEdits: string;

  private verificationChecked: boolean;
  private verifiedSession: boolean;
  private verifiedAction: boolean;

  view(vnode: m.Vnode<CommentAttrs>) {
    const {
      comment,
      handleIsReplying,
      isLast,
      isLocked,
      setIsGloballyEditing,
      threadLevel,
      updatedCommentsCallback,
    } = vnode.attrs;

    const setIsEditingComment = (status: boolean) => {
      setIsGloballyEditing(status);
      this.isEditingComment = status;
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
      !isLast && !isLocked && app.isLoggedIn() && app.user.activeAccount;

    const canEditAndDelete =
      !isLocked &&
      (comment.author === app.user.activeAccount?.address || isAdminOrMod);

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
      <div class={`Comment comment-${comment.id}`}>
        {threadLevel > 0 && (
          <div class="thread-connectors-container">
            {Array(threadLevel)
              .fill(undefined)
              .map(() => (
                <div class="thread-connector" />
              ))}
          </div>
        )}
        <div class="comment-body">
          <div class="comment-header">
            <CommentAuthor comment={comment} />
            {/* don't need this distinction yet since we aren't showing "edited at" */}
            {/* <CWText type="caption" className="published-text">
              published on
            </CWText> */}
            <CWText
              type="caption"
              fontWeight="medium"
              className="published-text"
            >
              {moment(comment.createdAt).format('l')}
            </CWText>
            {this.verifiedAction && this.verifiedSession && (
              <CWText
                type="caption"
                fontWeight="medium"
                className="verification-icon"
                onclick={() => showCanvasVerifyDataModal(comment)}
              >
                <CWIcon iconName="checkCircle" iconSize="xs" />
              </CWText>
            )}
          </div>
          {this.isEditingComment ? (
            <EditComment
              comment={comment}
              savedEdits={this.savedEdits}
              setIsEditing={setIsEditingComment}
              shouldRestoreEdits={this.shouldRestoreEdits}
              updatedCommentsCallback={updatedCommentsCallback}
            />
          ) : (
            <>
              <CWText className="comment-text">
                {renderQuillTextBody(comment.text)}
              </CWText>
              {!comment.deleted && (
                <div class="comment-footer">
                  <div class="menu-buttons-left">
                    <CommentReactionButton comment={comment} />
                    {canReply && (
                      <div
                        class="reply-button"
                        onclick={() => {
                          handleIsReplying(true, comment.id);
                        }}
                      >
                        <CWIcon iconName="feedback" iconSize="small" />
                        <CWText type="caption" className="menu-buttons-text">
                          Reply
                        </CWText>
                      </div>
                    )}
                  </div>
                  <div class="menu-buttons-right">
                    <SharePopover commentId={comment.id} />
                    {canEditAndDelete && (
                      <CWPopoverMenu
                        trigger={
                          <CWIconButton
                            iconName="dotsVertical"
                            iconSize="small"
                          />
                        }
                        menuItems={[
                          {
                            label: 'Edit',
                            iconLeft: 'write',
                            onclick: async (e) => {
                              e.preventDefault();
                              this.savedEdits = localStorage.getItem(
                                `${app.activeChainId()}-edit-comment-${
                                  comment.id
                                }-storedText`
                              );
                              if (this.savedEdits) {
                                clearEditingLocalStorage(
                                  comment.id,
                                  ContentType.Comment
                                );
                                this.shouldRestoreEdits =
                                  await confirmationModalWithText(
                                    'Previous changes found. Restore edits?',
                                    'Yes',
                                    'No'
                                  )();
                              }
                              setIsEditingComment(true);
                            },
                          },
                          {
                            label: 'Delete',
                            iconLeft: 'trash',
                            onclick: () => {
                              app.comments.delete(comment).then(() => {
                                m.redraw();
                              });
                            },
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
  }
}
