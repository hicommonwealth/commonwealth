import 'pages/view_proposal/create_comment.scss';

import m from 'mithril';
import { Button, Callout } from 'construct-ui';

import app from 'state';

import { OffchainThread, OffchainComment, AnyProposal, Account } from 'models';
import { ChainNetwork } from 'types';
import { CommentParent } from 'controllers/server/comments';
import EditProfileModal from 'views/modals/edit_profile_modal';
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

const CreateComment: m.Component<
  {
    callback: CallableFunction;
    cancellable?: boolean;
    getSetGlobalEditingStatus: CallableFunction;
    proposalPageState: IProposalPageState;
    parentComment?: OffchainComment<any>;
    rootProposal: AnyProposal | OffchainThread;
    tabindex?: number;
  },
  {
    quillEditorState: any;
    uploadsInProgress;
    error;
    saving: boolean;
    sendingComment;
  }
> = {
  view: (vnode) => {
    const {
      callback,
      cancellable,
      getSetGlobalEditingStatus,
      proposalPageState,
      rootProposal,
    } = vnode.attrs;
    let { parentComment } = vnode.attrs;
    let disabled =
      getSetGlobalEditingStatus(GlobalStatus.Get) ||
      vnode.state.quillEditorState?.editor?.editor?.isBlank();

    const author = app.user.activeAccount;
    const parentType =
      parentComment || proposalPageState.parentCommentId
        ? CommentParent.Comment
        : CommentParent.Proposal;
    if (!parentComment) parentComment = null;
    if (vnode.state.uploadsInProgress === undefined) {
      vnode.state.uploadsInProgress = 0;
    }

    const submitComment = async (e?) => {
      if (
        !vnode.state.quillEditorState ||
        !vnode.state.quillEditorState.editor
      ) {
        if (e) e.preventDefault();
        vnode.state.error = 'Editor not initialized, please try again';
        return;
      }
      if (vnode.state.quillEditorState.editor.editor.isBlank()) {
        if (e) e.preventDefault();
        vnode.state.error = 'Comment cannot be blank';
        return;
      }

      const { quillEditorState } = vnode.state;

      const mentionsEle = document.getElementsByClassName(
        'ql-mention-list-container'
      )[0];
      if (mentionsEle) (mentionsEle as HTMLElement).style.visibility = 'hidden';

      const commentText = quillEditorState.markdownMode
        ? quillEditorState.editor.getText()
        : JSON.stringify(quillEditorState.editor.getContents());

      const attachments = [];
      // const attachments = vnode.state.files ?
      //   vnode.state.files.map((f) => f.uploadURL.replace(/\?.*/, '')) : [];

      vnode.state.error = null;
      vnode.state.sendingComment = true;
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
        if (vnode.state.quillEditorState.editor) {
          vnode.state.quillEditorState.editor.enable();
          vnode.state.quillEditorState.editor.setContents();
          vnode.state.quillEditorState.clearUnsavedChanges();
        }
        vnode.state.sendingComment = false;
        proposalPageState.recentlySubmitted = res.id;
        // TODO: Instead of completely refreshing notifications, just add the comment to subscriptions
        // once we are receiving notifications from the websocket
        await app.user.notifications.refresh();
        m.redraw();
        jumpHighlightComment(res.id);
      } catch (err) {
        console.log(err);
        notifyError(err.message || 'Comment submission failed.');
        if (vnode.state.quillEditorState.editor) {
          vnode.state.quillEditorState.editor.enable();
        }
        vnode.state.error = err.message;
        vnode.state.sendingComment = false;
        m.redraw();
      }
      vnode.state.saving = false;

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

    const { error, sendingComment, uploadsInProgress } = vnode.state;
    disabled =
      getSetGlobalEditingStatus(GlobalStatus.Get) ||
      vnode.state.quillEditorState?.editor?.editor?.isBlank() ||
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
    return m(
      '.CreateComment',
      {
        class: parentScopedClass,
      },
      [
        m('.create-comment-avatar', [
          m(User, {
            user: author,
            popover: true,
            avatarOnly: true,
            avatarSize: 40,
          }),
        ]),
        m('.create-comment-body', [
          m('.reply-header', [
            m(
              'h3',
              parentType === CommentParent.Comment
                ? [
                    'Replying to ',
                    m(User, {
                      user: parentAuthor,
                      popover: true,
                      hideAvatar: true,
                    }),
                  ]
                : 'Reply'
            ),
          ]),
          m(User, { user: author, popover: true, hideAvatar: true }),
          rootProposal instanceof OffchainThread && rootProposal.readOnly
            ? m(Callout, {
                intent: 'primary',
                content:
                  'Commenting is disabled because this post has been locked.',
              })
            : [
                app.user.activeAccount?.profile &&
                  !app.user.activeAccount.profile.name &&
                  m(Callout, {
                    class: 'no-profile-callout',
                    intent: 'primary',
                    content: [
                      "You haven't set a display name yet. ",
                      m(
                        'a',
                        {
                          href:
                            `/${app.activeChainId()}/account/${
                              app.user.activeAccount.address
                            }?base=${app.user.activeAccount.chain}`,
                          onclick: (e) => {
                            e.preventDefault();
                            app.modals.create({
                              modal: EditProfileModal,
                              data: {
                                account: app.user.activeAccount,
                                refreshCallback: () => m.redraw(),
                              },
                            });
                          },
                        },
                        'Set a display name'
                      ),
                    ],
                  }),
                m(QuillEditor, {
                  contentsDoc: '',
                  oncreateBind: (state) => {
                    vnode.state.quillEditorState = state;
                  },
                  editorNamespace: `${document.location.pathname}-commenting`,
                  imageUploader: true,
                  tabindex: vnode.attrs.tabindex,
                }),
                m('.token-requirement', [
                  tokenPostingThreshold && tokenPostingThreshold.gt(new BN(0))
                    ? [
                        `Commenting in "${activeTopicName}" requires `,
                        `${weiToTokens(
                          tokenPostingThreshold.toString(),
                          decimals
                        )} `,
                        `${app.chain.meta.symbol}. `,
                        userBalance &&
                          app.user.activeAccount &&
                          `You have ${weiToTokens(
                            userBalance.toString(),
                            decimals
                          )} ${app.chain.meta.symbol}.`,
                      ]
                    : null,
                ]),
                m(
                  '.form-bottom',
                  {
                    onmouseover: () => m.redraw(), // keeps Quill's isBlank up to date
                  },
                  [
                    m('.form-buttons', [
                      m(Button, {
                        intent: 'primary',
                        type: 'submit',
                        compact: true,
                        disabled,
                        rounded: true,
                        onclick: submitComment,
                        label:
                          uploadsInProgress > 0 ? 'Uploading...' : 'Submit',
                      }),
                      cancellable &&
                        m(Button, {
                          intent: 'none',
                          type: 'cancel',
                          compact: true,
                          rounded: true,
                          onclick: (e) => {
                            e.preventDefault();
                            proposalPageState.replying = false;
                            proposalPageState.parentCommentId = null;
                          },
                          label: 'Cancel',
                        }),
                    ]),
                    error &&
                      m(CWValidationText, {
                        message: error,
                        status: 'failure',
                      }),
                  ]
                ),
              ],
        ]),
      ]
    );
  },
};

export default CreateComment;
