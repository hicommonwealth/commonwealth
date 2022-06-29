/* @jsx m */

import m from 'mithril';
import { Callout } from 'construct-ui';

import 'pages/view_proposal/create_comment.scss';

import app from 'state';
import { OffchainThread, OffchainComment, AnyProposal, Account } from 'models';
import { ChainNetwork } from 'types';
import { CommentParent } from 'controllers/server/comments';
import { EditProfileModal } from 'views/modals/edit_profile_modal';
import QuillEditor from 'views/components/quill_editor';
import User from 'views/components/widgets/user';
import { notifyError } from 'controllers/app/notifications';
import BN from 'bn.js';
import { weiToTokens } from 'helpers';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import { GlobalStatus } from './body';
import { IProposalPageState } from '.';
import jumpHighlightComment from './jump_to_comment';
import { CWValidationText } from '../../components/component_kit/cw_validation_text';
import { CWButton } from '../../components/component_kit/cw_button';
import { getClasses } from '../../components/component_kit/helpers';

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
  private quillEditorState: any;
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

    // console.log(
    //   'getSetGlobalEditingStatus',
    //   getSetGlobalEditingStatus(GlobalStatus.Get)
    // );

    // console.log(
    //   'editor is blank',
    //   this.quillEditorState?.editor?.editor?.isBlank()
    // );

    let disabled =
      getSetGlobalEditingStatus(GlobalStatus.Get) ||
      this.quillEditorState?.editor?.editor?.isBlank();

    const author = app.user.activeAccount;

    const parentType =
      parentComment || proposalPageState.parentCommentId
        ? CommentParent.Comment
        : CommentParent.Proposal;

    if (!parentComment) parentComment = null;

    if (this.uploadsInProgress === undefined) {
      this.uploadsInProgress = 0;
    }

    const submitComment = async (e?) => {
      if (!this.quillEditorState || !this.quillEditorState.editor) {
        if (e) e.preventDefault();
        this.error = 'Editor not initialized, please try again';
        return;
      }

      if (this.quillEditorState.editor.editor.isBlank()) {
        if (e) e.preventDefault();
        this.error = 'Comment cannot be blank';
        return;
      }

      const { quillEditorState } = this;

      const mentionsEle = document.getElementsByClassName(
        'ql-mention-list-container'
      )[0];

      if (mentionsEle) (mentionsEle as HTMLElement).style.visibility = 'hidden';

      const commentText = quillEditorState.markdownMode
        ? quillEditorState.editor.getText()
        : JSON.stringify(quillEditorState.editor.getContents());

      const attachments = [];

      this.error = null;

      this.sendingComment = true;

      quillEditorState.editor.enable(false);

      const chainId = app.activeChainId();

      try {
        const res = await app.comments.create(
          author.address,
          rootProposal.uniqueIdentifier,
          chainId,
          commentText,
          proposalPageState.parentCommentId,
          attachments
        );

        callback();

        if (this.quillEditorState.editor) {
          this.quillEditorState.editor.enable();
          this.quillEditorState.editor.setContents();
          this.quillEditorState.clearUnsavedChanges();
        }

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
        if (this.quillEditorState.editor) {
          this.quillEditorState.editor.enable();
        }
        this.error = err.message;
        this.sendingComment = false;
        m.redraw();
      }

      this.saving = false;

      proposalPageState.replying = false;

      proposalPageState.parentCommentId = null;
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

    disabled =
      getSetGlobalEditingStatus(GlobalStatus.Get) ||
      this.quillEditorState?.editor?.editor?.isBlank() ||
      sendingComment ||
      uploadsInProgress ||
      !app.user.activeAccount;

    // token balance check if needed
    const tokenPostingThreshold: BN =
      TopicGateCheck.getTopicThreshold(activeTopicName);

    const userBalance: BN = TopicGateCheck.getUserBalance();

    const topicGated = TopicGateCheck.isGatedTopic(activeTopicName);

    disabled = disabled || (!isAdmin && topicGated);

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
              {m(QuillEditor, {
                contentsDoc: '',
                oncreateBind: (state) => {
                  this.quillEditorState = state;
                },
                editorNamespace: `${document.location.pathname}-commenting`,
                imageUploader: true,
                tabindex: vnode.attrs.tabindex,
              })}
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
                    onclick={submitComment}
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
