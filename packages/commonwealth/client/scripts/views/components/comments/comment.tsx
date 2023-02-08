/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';

import 'components/comments/comment.scss';
import type { Account, Comment as CommentType } from 'models';
import moment from 'moment';

import app from 'state';
import { ContentType } from 'types';
import { ChainType } from '../../../../../../common-common/src/types';
import { confirmationModalWithText } from '../../modals/confirm_modal';
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

type CommentAuthorAttrs = {
  comment: CommentType<any>;
};

class CommentAuthor extends ClassComponent<CommentAuthorAttrs> {
  view(vnode: ResultNode<CommentAuthorAttrs>) {
    const { comment } = vnode.attrs;

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

  view(vnode: ResultNode<CommentAttrs>) {
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

    return (
      <div className={`Comment comment-${comment.id}`}>
        {threadLevel > 0 && (
          <div className="thread-connectors-container">
            {Array(threadLevel)
              .fill(undefined)
              .map(() => (
                <div className="thread-connector" />
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
                            onClick: () => {
                              app.comments.delete(comment).then(() => {
                                redraw();
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
