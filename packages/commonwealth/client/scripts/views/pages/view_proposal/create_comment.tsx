/* @jsx m */

import m from 'mithril';
import BN from 'bn.js';

import 'pages/view_proposal/create_comment.scss';

import app from 'state';
import { Thread, AnyProposal } from 'models';
import { ChainNetwork } from 'common-common/src/types';
import { CommentParent } from 'controllers/server/comments';
import { EditProfileModal } from 'views/modals/edit_profile_modal';
import { QuillEditorComponent } from 'views/components/quill/quill_editor_component';
import { QuillEditor } from 'views/components/quill/quill_editor';
import User from 'views/components/widgets/user';
import { notifyError } from 'controllers/app/notifications';
import { weiToTokens } from 'helpers';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import { CWValidationText } from '../../components/component_kit/cw_validation_text';
import { CWButton } from '../../components/component_kit/cw_button';
import { jumpHighlightComment } from './helpers';
import { CWText } from '../../components/component_kit/cw_text';

type CreateCommmentAttrs = {
  handleIsReplying?: (isReplying: boolean, id?: number) => void;
  parentCommentId: number;
  rootProposal: AnyProposal | Thread;
  updatedCommentsCallback: () => void;
};

export class CreateComment implements m.ClassComponent<CreateCommmentAttrs> {
  private error;
  private quillEditorState: QuillEditor;
  private saving: boolean;
  private sendingComment;
  private uploadsInProgress;

  view(vnode) {
    const {
      handleIsReplying,
      parentCommentId,
      rootProposal,
      updatedCommentsCallback,
    } = vnode.attrs;

    const author = app.user.activeAccount;

    const parentType = parentCommentId
      ? CommentParent.Comment
      : CommentParent.Proposal;

    if (this.uploadsInProgress === undefined) {
      this.uploadsInProgress = 0;
    }

    const handleSubmitComment = async (e?: Event) => {
      if (!this.quillEditorState) {
        if (e) e.preventDefault();
        this.error = 'Editor not initialized, please try again';
        return;
      }

      if (this.quillEditorState?.isBlank()) {
        if (e) e.preventDefault();
        this.error = 'Comment cannot be blank';
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

        m.redraw();

        jumpHighlightComment(res.id);
      } catch (err) {
        console.log(err);
        notifyError(err.message || 'Comment submission failed.');
        this.quillEditorState.enable();
        this.error = err.message;
        this.sendingComment = false;
        m.redraw();
      }

      this.saving = false;
      handleIsReplying(false);
      m.redraw();
    };

    const activeTopicName =
      rootProposal instanceof Thread ? rootProposal?.topic?.name : null;

    const { error, sendingComment, uploadsInProgress } = this;

    // token balance check if needed
    const tokenPostingThreshold: BN =
      TopicGateCheck.getTopicThreshold(activeTopicName);

    const userBalance: BN = TopicGateCheck.getUserBalance();

    const disabled =
      this.quillEditorState?.isBlank() || sendingComment || uploadsInProgress;

    const decimals = app.chain?.meta?.decimals
      ? app.chain.meta.decimals
      : app.chain.network === ChainNetwork.ERC721
      ? 0
      : 18;

    return (
      <div class="CreateComment">
        <div class="attribution-row">
          <CWText type="caption">
            {parentType === CommentParent.Comment ? 'Reply as' : 'Comment as'}
          </CWText>
          <CWText type="caption" fontWeight="medium" className="user-link-text">
            {m(User, { user: author, hideAvatar: true, linkify: true })}
          </CWText>
        </div>
        {rootProposal instanceof Thread && rootProposal.readOnly ? (
          <CWText type="h5" className="callout-text">
            Commenting is disabled because this post has been locked.
          </CWText>
        ) : (
          <>
            {app.user.activeAccount?.profile &&
              !app.user.activeAccount.profile.name && (
                <CWText type="h5" className="callout-text">
                  You haven't set a display name yet.
                  <a
                    href={`/${app.activeChainId()}/account/${
                      app.user.activeAccount.address
                    }?base=${app.user.activeAccount.chain.id}`}
                    onclick={(e) => {
                      e.preventDefault();
                      app.modals.create({
                        modal: EditProfileModal,
                        data: {
                          account: app.user.activeAccount,
                          refreshCallback: () => m.redraw(),
                        },
                      });
                    }}
                  >
                    Set a display name.
                  </a>
                </CWText>
              )}
            <QuillEditorComponent
              contentsDoc=""
              oncreateBind={(state: QuillEditor) => {
                this.quillEditorState = state;
              }}
              editorNamespace={`${document.location.pathname}-commenting`}
              imageUploader
              tabindex={vnode.attrs.tabindex}
            />
            {tokenPostingThreshold && tokenPostingThreshold.gt(new BN(0)) && (
              <CWText className="token-req-text">
                Commenting in {activeTopicName} requires{' '}
                {weiToTokens(tokenPostingThreshold.toString(), decimals)}{' '}
                {app.chain.meta.default_symbol}.{' '}
                {userBalance && app.user.activeAccount && (
                  <>
                    You have {weiToTokens(userBalance.toString(), decimals)}{' '}
                    {app.chain.meta.default_symbol}.
                  </>
                )}
              </CWText>
            )}
            <div
              class="form-bottom"
              onmouseover={() => {
                // keeps Quill's isBlank up to date
                return m.redraw();
              }}
            >
              <div class="form-buttons">
                <CWButton
                  disabled={
                    !handleIsReplying
                      ? this.quillEditorState?.isBlank()
                      : undefined
                  }
                  buttonType="secondary-blue"
                  onclick={(e) => {
                    e.preventDefault();

                    if (handleIsReplying) {
                      handleIsReplying(false);
                    }
                  }}
                  label="Cancel"
                />
                <CWButton
                  disabled={disabled}
                  onclick={handleSubmitComment}
                  label={uploadsInProgress > 0 ? 'Uploading...' : 'Submit'}
                />
              </div>
              {error && <CWValidationText message={error} status="failure" />}
            </div>
          </>
        )}
      </div>
    );
  }
}
