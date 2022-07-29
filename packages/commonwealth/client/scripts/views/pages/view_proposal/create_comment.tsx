/* @jsx m */

import m from 'mithril';
import { Callout } from 'construct-ui';

import 'pages/view_proposal/create_comment.scss';

import app from 'state';
import { OffchainThread, OffchainComment, AnyProposal, Account } from 'models';
import { ChainNetwork } from 'common-common/src/types';
import { CommentParent } from 'controllers/server/comments';
import { EditProfileModal } from 'views/modals/edit_profile_modal';
import { QuillEditorComponent } from 'views/components/quill/quill_editor_component';
import { QuillEditor } from 'views/components/quill/quill_editor';
import User from 'views/components/widgets/user';
import { notifyError } from 'controllers/app/notifications';
import BN from 'bn.js';
import { weiToTokens } from 'helpers';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import { GlobalStatus } from './body';
import { IProposalPageState } from '.';
import { CWValidationText } from '../../components/component_kit/cw_validation_text';
import { CWButton } from '../../components/component_kit/cw_button';
import { getClasses } from '../../components/component_kit/helpers';
import { jumpHighlightComment } from './helpers';

type CreateCommmentAttrs = {
  callback: CallableFunction;
  cancellable?: boolean;
  getSetGlobalEditingStatus: CallableFunction;
  parentComment?: OffchainComment<any>;
  proposalPageState: IProposalPageState;
  rootProposal: AnyProposal | OffchainThread;
  tabindex?: number;
};

export class CreateComment implements m.ClassComponent<CreateCommmentAttrs> {
  private error;
  private quillEditorState: QuillEditor;
  private saving: boolean;
  private sendingComment;
  private uploadsInProgress;

  view(vnode) {
    const {
      callback,
      cancellable,
      getSetGlobalEditingStatus,
      proposalPageState,
      rootProposal,
    } = vnode.attrs;

    let { parentComment } = vnode.attrs;

    const author = app.user.activeAccount;

    const parentType =
      parentComment || proposalPageState.parentCommentId
        ? CommentParent.Comment
        : CommentParent.Proposal;

    if (!parentComment) parentComment = null;

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
          proposalPageState.parentCommentId,
        );

        callback();
        this.quillEditorState.resetEditor();
        this.error = null;
        this.sendingComment = false;


        this.sendingComment = false;

        proposalPageState.recentlySubmitted = res.id;
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
      proposalPageState.replying = false;
      proposalPageState.parentCommentId = null;
      m.redraw();
    };

    const activeTopicName =
      rootProposal instanceof OffchainThread ? rootProposal?.topic?.name : null;

    const isAdmin =
      app.user.isSiteAdmin ||
      app.user.isAdminOfEntity({ chain: app.activeChainId() });

    let parentScopedClass = 'new-thread-child';

    let parentAuthor: Account<any>;

    if (parentType === CommentParent.Comment) {
      parentScopedClass = 'new-comment-child';
      parentAuthor = app.chain.accounts.get(parentComment.author);
    }

    const { error, sendingComment, uploadsInProgress } = this;

    // token balance check if needed
    const tokenPostingThreshold: BN =
      TopicGateCheck.getTopicThreshold(activeTopicName);

    const userBalance: BN = TopicGateCheck.getUserBalance();

    const disabled =
      getSetGlobalEditingStatus(GlobalStatus.Get) ||
      this.quillEditorState?.isBlank() ||
      sendingComment ||
      uploadsInProgress ||
      !app.user.activeAccount ||
      (!isAdmin && TopicGateCheck.isGatedTopic(activeTopicName));

    const decimals = app.chain?.meta?.decimals
      ? app.chain.meta.decimals
      : app.chain.network === ChainNetwork.ERC721
      ? 0
      : 18;

    return (
      <div
        class={getClasses<{ parentScopedClass: string }>(
          { parentScopedClass },
          'CreateComment'
        )}
      >
        <div class="create-comment-avatar">
          {m(User, {
            user: author,
            popover: true,
            avatarOnly: true,
            avatarSize: 40,
          })}
        </div>
        <div class="create-comment-body">
          <div class="reply-header">
            <h3>
              {parentType === CommentParent.Comment ? (
                <>
                  Replying to{' '}
                  {m(User, {
                    user: parentAuthor,
                    popover: true,
                    hideAvatar: true,
                  })}
                </>
              ) : (
                'Reply'
              )}
            </h3>
          </div>
          {m(User, { user: author, popover: true, hideAvatar: true })}
          {rootProposal instanceof OffchainThread && rootProposal.readOnly ? (
            <Callout
              intent="primary"
              content="Commenting is disabled because this post has been locked."
            />
          ) : (
            <>
              {app.user.activeAccount?.profile &&
                !app.user.activeAccount.profile.name && (
                  <Callout
                    class="no-profile-callout"
                    intent="primary"
                    content={
                      <>
                        You haven't set a display name yet.{' '}
                        <a
                          href={`/${app.activeChainId()}/account/${
                            app.user.activeAccount.address
                          }?base=${app.user.activeAccount.chain}`}
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
                          Set a display name
                        </a>
                      </>
                    }
                  />
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
                <div class="token-requirement">
                  Commenting in {activeTopicName} requires{' '}
                  {weiToTokens(tokenPostingThreshold.toString(), decimals)} $
                  {app.chain.meta.symbol}.
                  {userBalance && app.user.activeAccount && (
                    <>
                      You have ${weiToTokens(userBalance.toString(), decimals)}{' '}
                      ${app.chain.meta.symbol}.
                    </>
                  )}
                </div>
              )}
              <div
                class="form-bottom"
                onmouseover={() => {
                  // keeps Quill's isBlank up to date
                  return m.redraw();
                }}
              >
                <div class="form-buttons">
                  {cancellable && (
                    <CWButton
                      buttonType="secondary-blue"
                      onclick={(e) => {
                        e.preventDefault();
                        proposalPageState.replying = false;
                        proposalPageState.parentCommentId = null;
                      }}
                      label="Cancel"
                    />
                  )}
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
      </div>
    );
  }
}
