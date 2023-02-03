/* @jsx jsx */
import React from 'react';

import { ClassComponent, redraw, jsx } from 'mithrilInterop';
import type { ResultNode } from 'mithrilInterop';
import BN from 'bn.js';
import { ChainBase, ChainNetwork } from 'common-common/src/types';

import 'components/comments/create_comment.scss';
import { notifyError } from 'controllers/app/notifications';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import { weiToTokens } from 'helpers';
import type { AnyProposal } from 'models';
import { Thread } from 'models';

import app from 'state';
import { ContentType } from 'types';
import type { QuillEditor } from 'views/components/quill/quill_editor';
import { QuillEditorComponent } from 'views/components/quill/quill_editor_component';
import { User } from 'views/components/user/user';
import { EditProfileModal } from 'views/modals/edit_profile_modal';
import { CWButton } from '../component_kit/cw_button';
import { CWText } from '../component_kit/cw_text';
import { CWValidationText } from '../component_kit/cw_validation_text';
import { jumpHighlightComment } from './helpers';

type CreateCommmentAttrs = {
  handleIsReplying?: (isReplying: boolean, id?: number) => void;
  parentCommentId?: number;
  rootProposal: AnyProposal | Thread;
  updatedCommentsCallback: () => void;
};

export class CreateComment extends ClassComponent<CreateCommmentAttrs> {
  private error;
  private quillEditorState: QuillEditor;
  private saving: boolean;
  private sendingComment;
  private uploadsInProgress;

  view(vnode: ResultNode<CreateCommmentAttrs>) {
    const {
      handleIsReplying,
      parentCommentId,
      rootProposal,
      updatedCommentsCallback,
    } = vnode.attrs;

    const author = app.user.activeAccount;

    const parentType = parentCommentId
      ? ContentType.Comment
      : ContentType.Thread;

    if (this.uploadsInProgress === undefined) {
      this.uploadsInProgress = 0;
    }

    const handleSubmitComment = async (
      e?: React.MouseEvent<HTMLButtonElement>
    ) => {
      if (!this.quillEditorState) {
        if (e) e.preventDefault();
        this.error = 'Editor not initialized, please try again';
        return;
      }

      const commentText = this.quillEditorState.textContentsAsString;

      this.error = null;

      this.sendingComment = true;

      this.quillEditorState.disable();

      const chainId = app.activeChainId();

      try {
        const res = await app.comments.create(
          author.address,
          rootProposal.uniqueIdentifier,
          chainId,
          commentText,
          parentCommentId
        );

        updatedCommentsCallback();

        this.quillEditorState.resetEditor();

        this.error = null;

        this.sendingComment = false;

        // TODO: Instead of completely refreshing notifications, just add the comment to subscriptions
        // once we are receiving notifications from the websocket
        await app.user.notifications.refresh();

        redraw();

        jumpHighlightComment(res.id);
      } catch (err) {
        console.log(err);
        notifyError(err.message || 'Comment submission failed.');
        this.quillEditorState.enable();
        this.error = err.message;
        this.sendingComment = false;
        redraw();
      }

      this.saving = false;

      if (handleIsReplying) {
        handleIsReplying(false);
      }
      redraw();
    };

    const activeTopicName =
      rootProposal instanceof Thread ? rootProposal?.topic?.name : null;

    const { error, sendingComment, uploadsInProgress } = this;

    // token balance check if needed
    const tokenPostingThreshold: BN = TopicGateCheck.getTopicThreshold(
      activeTopicName
    );

    const userBalance: BN = TopicGateCheck.getUserBalance();
    const userFailsThreshold =
      tokenPostingThreshold?.gtn(0) &&
      userBalance?.gtn(0) &&
      userBalance.lt(tokenPostingThreshold);

    const disabled =
      this.quillEditorState?.isBlank() ||
      sendingComment ||
      uploadsInProgress ||
      userFailsThreshold;

    const decimals = app.chain?.meta?.decimals
      ? app.chain.meta.decimals
      : app.chain.network === ChainNetwork.ERC721
      ? 0
      : app.chain.base === ChainBase.CosmosSDK
      ? 6
      : 18;

    return (
      <div className="CreateComment">
        {app.user.activeAccount && !app.user.activeAccount?.profile.name ? (
          <CWText type="h5" className="callout-text">
            You haven't set a display name yet.
            <a
              href={`/${app.activeChainId()}/account/${
                app.user.activeAccount.address
              }?base=${app.user.activeAccount.chain.id}`}
              onClick={(e) => {
                e.preventDefault();
                app.modals.create({
                  modal: EditProfileModal,
                  data: {
                    account: app.user.activeAccount,
                    refreshCallback: () => redraw(),
                  },
                });
              }}
            >
              Set a display name.
            </a>
          </CWText>
        ) : (
          <React.Fragment>
            <div className="attribution-row">
              <div className="attribution-left-content">
                <CWText type="caption">
                  {parentType === ContentType.Comment
                    ? 'Reply as'
                    : 'Comment as'}
                </CWText>
                <CWText
                  type="caption"
                  fontWeight="medium"
                  className="user-link-text"
                >
                  <User user={author} hideAvatar linkify />
                </CWText>
              </div>
              {error && <CWValidationText message={error} status="failure" />}
            </div>
            <QuillEditorComponent
              contentsDoc=""
              oncreateBind={(state: QuillEditor) => {
                this.quillEditorState = state;
              }}
              editorNamespace={`${document.location.pathname}-commenting`}
              imageUploader
            />
            {tokenPostingThreshold && tokenPostingThreshold.gt(new BN(0)) && (
              <CWText className="token-req-text">
                Commenting in {activeTopicName} requires{' '}
                {weiToTokens(tokenPostingThreshold.toString(), decimals)}{' '}
                {app.chain.meta.default_symbol}.{' '}
                {userBalance && app.user.activeAccount && (
                  <React.Fragment>
                    You have {weiToTokens(userBalance.toString(), decimals)}{' '}
                    {app.chain.meta.default_symbol}.
                  </React.Fragment>
                )}
              </CWText>
            )}
            <div
              className="form-bottom"
              onMouseOver={() => {
                // keeps Quill's isBlank up to date
                return this.redraw();
              }}
            >
              <div className="form-buttons">
                <CWButton
                  disabled={
                    !handleIsReplying
                      ? this.quillEditorState?.isBlank()
                      : undefined
                  }
                  buttonType="secondary-blue"
                  onClick={(e) => {
                    e.preventDefault();

                    if (handleIsReplying) {
                      handleIsReplying(false);
                    }
                  }}
                  label="Cancel"
                />
                <CWButton
                  disabled={disabled}
                  onClick={handleSubmitComment}
                  label={uploadsInProgress > 0 ? 'Uploading...' : 'Submit'}
                />
              </div>
            </div>
          </React.Fragment>
        )}
      </div>
    );
  }
}
