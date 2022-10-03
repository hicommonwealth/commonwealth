/* @jsx m */

import m from 'mithril';
import moment from 'moment';

import 'pages/view_proposal/proposal_comment.scss';

import app from 'state';
import { Comment } from 'models';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { ProposalBodyAuthor } from './proposal_components';
import { CWText } from '../../components/component_kit/cw_text';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { renderQuillTextBody } from '../../components/quill/helpers';
import { EditComment } from './edit_comment';
import { SocialSharingCarat } from './social_sharing_carat';
import { CommentReactionButton } from '../../components/reaction_button/comment_reaction_button';
import { confirmationModalWithText } from '../../modals/confirm_modal';
import { clearEditingLocalStorage } from './helpers';

type ProposalCommentAttrs = {
  comment: Comment<any>;
  handleIsReplying: (isReplying: boolean, id?: number) => void;
  isGloballyEditing: boolean;
  isLast: boolean;
  setIsGloballyEditing: (status: boolean) => void;
  threadLevel: number;
  updatedCommentsCallback?: () => void;
};

export class ProposalComment implements m.ClassComponent<ProposalCommentAttrs> {
  private isEditingComment: boolean;
  private shouldRestoreEdits: boolean;
  private savedEdits: string;

  view(vnode) {
    const {
      comment,
      handleIsReplying,
      isLast,
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

    return (
      <div class={`ProposalComment comment-${comment.id}`}>
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
            <ProposalBodyAuthor item={comment} />
            <CWText type="caption" className="published-text">
              published on
            </CWText>
            <CWText
              type="caption"
              fontWeight="medium"
              className="published-text"
            >
              {moment(comment.createdAt).format('l')}
            </CWText>
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
              <CWText type="b2">{renderQuillTextBody(comment.text)}</CWText>
              {!comment.deleted && (
                <div class="comment-footer">
                  <div class="menu-buttons-left">
                    <CommentReactionButton comment={comment} />
                    {!isLast && (
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
                    <SocialSharingCarat commentId={comment.id} />
                    {(comment.author === app.user.activeAccount?.address ||
                      isAdminOrMod) && (
                      <CWPopoverMenu
                        trigger={
                          <CWIconButton
                            iconName="dotsVertical"
                            iconSize="small"
                          />
                        }
                        popoverMenuItems={[
                          {
                            label: 'Edit',
                            iconName: 'edit',
                            onclick: async () => {
                              this.savedEdits = localStorage.getItem(
                                `${app.activeChainId()}-edit-comment-${
                                  comment.id
                                }-storedText`
                              );
                              if (this.savedEdits) {
                                clearEditingLocalStorage(comment, false);
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
                            iconName: 'trash',
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
