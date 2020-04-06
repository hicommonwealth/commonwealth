/* eslint-disable prefer-template */
import 'pages/view_proposal.scss';

import { default as $ } from 'jquery';
import { default as m } from 'mithril';
import { default as mixpanel } from 'mixpanel-browser';
import { default as lity } from 'lity';

import Near from 'controllers/chain/near/main';
import { WalletAccount } from 'nearlib';

import { updateRoute } from 'app';
import app, { LoginState } from 'state';
import { idToProposal, ProposalType, proposalSlugToFriendlyName } from 'identifiers';
import { pluralize, slugify, symbols, link, externalLink, isSameAccount } from 'helpers';

import CommentsController, { CommentParent } from 'controllers/server/comments';
import OffchainAccounts from 'controllers/chain/community/account';
import SubstrateDemocracyProposal from 'controllers/chain/substrate/democracy_proposal';
import { SubstrateDemocracyReferendum } from 'controllers/chain/substrate/democracy';
import {
  OffchainThread,
  OffchainThreadKind,
  OffchainComment,
  Proposal,
  AnyProposal,
  Account,
  Profile,
  ChainBase
} from 'models';
import { NotificationCategories } from 'types';

import ReactionButton, { ReactionType } from 'views/components/reaction_button';
import ProposalVotingActions from 'views/components/proposals/voting_actions';
import ProposalVotingResults from 'views/components/proposals/voting_results';
import Tabs from 'views/components/widgets/tabs';
import QuillEditor from 'views/components/quill_editor';
import QuillFormattedText from 'views/components/quill_formatted_text';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import { getStatusClass, getStatusText, getSupportText } from 'views/components/proposal_row';
import ProfileBlock from 'views/components/widgets/profile_block';
import ViewCountBlock from 'views/components/widgets/view_count_block';
import User from 'views/components/widgets/user';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import LinkNewAddressModal from 'views/modals/link_new_address_modal';
import PreviewModal from 'views/modals/preview_modal';
import ListingPage from 'views/pages/_listing_page';
import PageLoading from 'views/pages/loading';
import PageNotFound from 'views/pages/404';
import moment from 'moment';
<<<<<<< HEAD
import { SubstrateTreasuryProposal } from 'controllers/chain/substrate/treasury';
=======
import VersionHistoryModal from '../modals/version_history_modal';
>>>>>>> master
import { formatCoin } from 'adapters/currency';
import { parseMentionsForServer } from './threads';
import VersionHistoryModal from '../modals/version_history_modal';

const activeQuillEditorHasText = () => {
  // TODO: Better lookup than document.getElementsByClassName[0]
  // TODO: This should also check whether the Quill editor has changed, rather than whether it has text
  // However, threading is overdue for a refactor anyway, so we'll handle this then
  return (document.getElementsByClassName('ql-editor')[0] as HTMLTextAreaElement)?.innerText.length > 1
};

// highlight the header/body of a parent thread, or the body of a comment
export const jumpHighlightComment = (commentId, shouldScroll = true, animationDelayTime = 2000) => {
  const $div = commentId === 'parent'
    ? $('html, body').find('.ProposalHeader')
    : commentId === 'body'
      ? $('html, body').find('.ProposalBody')
      : $('html, body').find(`.comment-${commentId}`);
  if ($div.length === 0) return; // if the passed comment was invalid, abort
  const divTop = $div.position().top;
  const scrollTime = 500; // time to scroll
  const minimumVisibleHeight = 250; // minimum amount of the comment that must appear in the current viewport

  // clear any previous animation
  $div.removeClass('highlighted highlightAnimationComplete');

  // scroll to comment if necessary, set highlight, wait, then fade out the highlight
  if (shouldScroll) {
    $('html, body').animate({ scrollTop: divTop }, scrollTime);
    $div.addClass('highlighted');
    setTimeout(() => {
      $div.addClass('highlightAnimationComplete');
    }, animationDelayTime + scrollTime);
  } else {
    $div.addClass('highlighted');
    setTimeout(() => {
      $div.addClass('highlightAnimationComplete');
    }, animationDelayTime);
  }
};

enum GlobalStatus {
  Get = 'get',
  Set = 'set'
}

interface IViewProposalPageAttrs {
  identifier: string;
  type: string;
}

interface IViewProposalPageState {
  editing: boolean;
  replyParent: number | boolean;
  highlightedComment: boolean;
  mixpanelExecuted: boolean;
}

interface IProposalHeaderAttrs {
  author: Account<any>;
  isThread: boolean;
  nComments: number;
  proposal: any;
}

interface ISidebarAttrs {
  isThread: boolean;
  nComments: number;
  nVoters: number;
  proposal: AnyProposal;
}

interface IProposalBodyAttrs {
  author: Account<any>;
  getSetGlobalEditingStatus: any;
  getSetGlobalReplyStatus: CallableFunction;
  isThread: boolean;
  proposal: AnyProposal | OffchainThread;
}

interface IProposalBodyState {
  editing: boolean;
  quillEditorState: any;
}

const ProposalHeader: m.Component<IProposalHeaderAttrs> = {
  view: (vnode: m.VnodeDOM<IProposalHeaderAttrs>) => {
    const { author, isThread, nComments, proposal } = vnode.attrs;
    const subscription = app.isLoggedIn()
      ? app.login.notifications.subscriptions.find((v) => v.objectId === proposal.uniqueIdentifier)
      : null;

    const subtitle = (proposal.ProposalType === ProposalType.SubstrateTreasuryProposal) ?
      `Proposed spend: ${formatCoin(proposal.value)} to ${proposal.beneficiaryAddress}` :
      proposal.title;

    return m('.ProposalHeader', {
      class: `proposal-${proposal.slug}`
    }, [
      m('.row.row-narrow', [
        m('.col-xs-12.col-lg-9', [
          m('.proposal-title-row', [
            m('.title', proposal.title),
          ]),
          isThread
            ? m('.discussion-meta', [
              proposal.createdAt && m('.created', proposal.createdAt.format('MMM D, YYYY')),
              m('.Tags', [
                (proposal as OffchainThread).tags?.map((tag) => {
                  return link('a', `/${app.activeId()}/discussions/${tag.name}`, `#${tag.name}`);
                }),
              ]),
              m(ViewCountBlock, { proposal }),
              m('.proposal-comment-summary', pluralize(nComments, 'comment')),
              m('.reaction', m(ReactionButton, { proposal, type: ReactionType.Like })),
            ])
            : m('.proposal-meta', [
              author && m('span.proposal-user', [
                m(User, {
                  user: author,
                  hideAvatar: true,
                  tooltip: true,
                }),
              ]),
              m('span.proposal-display-id', `${proposalSlugToFriendlyName.get(proposal.slug)} ${proposal.shortIdentifier}`),
              m('span.proposal-status', { class: getStatusClass(proposal) }, getStatusText(proposal, true)),
              proposal.createdAt
              && m('span.proposal-created', 'Created ' + proposal.createdAt.fromNow()),
            ]),
          isThread
          && proposal.kind === OffchainThreadKind.Link
          && m('.proposal-extra', [
            externalLink('a.external-link', proposal.url, [ 'Open in new window ', m.trust('&rarr;') ]),
          ]),
        ]),
        m('.col-xs-12.col-lg-3', [
          app.isLoggedIn() && m('button.thread-subscription', {
            disabled: !app.isLoggedIn(),
            class: subscription?.isActive ? 'formular-button-primary' : '',
            onclick: (e) => {
              e.preventDefault();
              if (subscription?.isActive) {
                app.login.notifications.disableSubscriptions([subscription]).then(() => m.redraw());
              } else {
                app.login.notifications.subscribe(
                  NotificationCategories.NewComment, proposal.uniqueIdentifier,
                ).then(() => m.redraw());
              }
            }
          }, [
            subscription?.isActive ?
              [ m('span.icon-bell'), ' Notifications on' ] :
              [ m('span.icon-bell-off'), ' Notifications off' ]
          ]),
        ]),
        !isThread && m('.col-xs-12.col-lg-12', [
          m('.proposal-subtitle-row', [
            m('.title', subtitle),
          ]),
        ]),
      ]),
    ]);
  }
};

export const ProposalBody: m.Component<IProposalBodyAttrs, IProposalBodyState> = {
  view: (vnode: m.VnodeDOM<IProposalBodyAttrs, IProposalBodyState>) => {
    const { author, getSetGlobalEditingStatus, getSetGlobalReplyStatus, isThread, proposal } = vnode.attrs;
    const description = isThread ? false : (proposal as AnyProposal).description;
    const body = isThread ? (proposal as OffchainThread).body : false;
    const attachments = isThread ? (proposal as OffchainThread).attachments : false;
    const versionHistory = (proposal as OffchainThread).versionHistory;
    const lastEdit = versionHistory?.length > 1 ? JSON.parse(versionHistory[0]) : null;
    const proposalLink = `/${app.activeId()}/proposal/${proposal.slug}/${proposal.identifier}-${slugify(proposal.title)}`;
    return m('.ProposalBody', {
      class: `proposal-${proposal.slug}`
    }, [
      m('.left-col', [
        author && m(User, { user: author, avatarOnly: true, avatarSize: 36, tooltip: true }),
      ]),
      m('.right-col', [
        m('.upper-meta', [
          m('.upper-meta-left', [
            author && m(User, { user: author, hideAvatar: true, linkify: true, tooltip: true }),
            proposal.createdAt
            && m('a.comment-timestamp', {
              href: proposalLink + '?comment=body',
              onclick: (e) => {
                e.preventDefault();
                updateRoute(proposalLink + '?comment=body');
                jumpHighlightComment('body', false, 500);
              }
            }, proposal.createdAt.fromNow()),
            isThread
            && versionHistory.length > 1
            && m('a.last-edited', {
              href: '#',
              onclick: async (e) => {
                e.preventDefault();
                app.modals.create({
                  modal: VersionHistoryModal,
                  data: {
                    proposal
                  }
                });
              }
            }, [
              'Edited ',
              moment(lastEdit.timestamp).fromNow()
            ])
          ]),
          m('.upper-meta-right', [
            app.vm.activeAccount
            && !getSetGlobalEditingStatus(GlobalStatus.Get)
            && !vnode.state.editing
            && m('a', {
              class: 'reply',
              href: '#',
              onclick: async (e) => {
                e.preventDefault();
                if (getSetGlobalReplyStatus(GlobalStatus.Get) && activeQuillEditorHasText()) {
                  const confirmed = await confirmationModalWithText('Unsubmitted replies will be lost. Continue?')();
                  if (!confirmed) return;
                }
                getSetGlobalReplyStatus(GlobalStatus.Set, false);
              },
            }, 'Reply'),
            !getSetGlobalEditingStatus(GlobalStatus.Get)
            && isSameAccount(app.vm.activeAccount, author)
            && isThread
            && !vnode.state.editing
            && m('a', {
              class: 'edit-proposal',
              href: '#',
              onclick: async (e) => {
                e.preventDefault();
                if (getSetGlobalReplyStatus(GlobalStatus.Get)) {
                  if (activeQuillEditorHasText()) {
                    const confirmed = await confirmationModalWithText('Unsubmitted replies will be lost. Continue?')();
                    if (!confirmed) return;
                  }
                  getSetGlobalReplyStatus(GlobalStatus.Set, false, true);
                }
                vnode.state.editing = true;
                getSetGlobalEditingStatus(GlobalStatus.Set, true);
              },
            }, 'Edit'),
            !getSetGlobalEditingStatus(GlobalStatus.Get)
            && isSameAccount(app.vm.activeAccount, author)
            && !vnode.state.editing
            && m('a', {
              href: '#',
              onclick: async (e) => {
                e.preventDefault();
                const confirmed = await confirmationModalWithText('Delete this entire thread?')();
                if (!confirmed) return;
                app.threads.delete(proposal).then(() => {
                  m.route.set(`/${app.activeId()}/`);
                  // TODO: set notification bar for 'thread deleted'
                });
              },
            }, 'Delete'),
            vnode.state.editing
            && m('a', {
              class: 'cancel-editing',
              href: '#',
              onclick: async (e) => {
                e.preventDefault();
                // TODO: Only show confirmation modal if edits have been made
                const confirmed = await confirmationModalWithText('Cancel editing? Changes will not be saved.')();
                if (!confirmed) return;
                vnode.state.editing = false;
                getSetGlobalEditingStatus(GlobalStatus.Set, false);
                m.redraw();
              }
            }, 'Cancel'),
            vnode.state.editing
            && m('a', {
              href: '#',
              onclick: (e) => {
                e.preventDefault();
                const threadText = vnode.state.quillEditorState.markdownMode
                  ? vnode.state.quillEditorState.editor.getText()
                  : JSON.stringify(vnode.state.quillEditorState.editor.getContents());
                app.threads.edit((proposal as OffchainThread), threadText)
                  .then(() => {
                    m.route.set(`/${app.activeId()}/proposal/${proposal.slug}/${(proposal as OffchainThread).id}`);
                    vnode.state.editing = false;
                    getSetGlobalEditingStatus(GlobalStatus.Set, false);
                    m.redraw();
                    // TODO: set notification bar for 'thread edited' (?)
                  });
              }
            }, 'Save')
          ]),
        ]),
        isThread
        && !vnode.state.editing
        && body
          ? m('.body-text', (() => {
            try {
              const doc = JSON.parse(body);
              return m(QuillFormattedText, { doc });
            } catch (e) {
              return m(MarkdownFormattedText, { doc: body });
            }
          })())
          : description
        && m('.body-text', [
          m(MarkdownFormattedText, { doc: description })
        ]),
        isThread
        && !vnode.state.editing
        && attachments
        && attachments.length > 0
        && m('.proposal-attachments', [
          m('p', `Attachments (${attachments.length})`),
          attachments.map((attachment) => m('a.attachment-item', {
            href: attachment.url,
            title: attachment.description,
            target: '_blank',
            noopener: 'noopener',
            noreferrer: 'noreferrer',
            onclick: (e) => {
              e.preventDefault();
              lity(attachment.url);
            }
          }, [
            m('img', {
              src: attachment.url
            }),
          ]))
        ]),
        isThread
        && vnode.state.editing
        && m(QuillEditor, {
          contentsDoc: (() => {
            try {
              return JSON.parse((proposal as OffchainThread).body);
            } catch (e) {
              return (proposal as OffchainThread).body;
            }
          })(),
          oncreateBind: (state) => {
            vnode.state.quillEditorState = state;
          },
          tabindex: 1,
          theme: 'snow',
          editorNamespace: document.location.pathname + '-editing-thread',
        }),
      ])
    ]);
  }
};

interface IProposalCommentState {
  editing: boolean;
  replying: boolean;
  quillEditorState: any;
}

interface IProposalCommentAttrs {
  comment: OffchainComment<any>;
  getSetGlobalEditingStatus: CallableFunction;
  getSetGlobalReplyStatus: CallableFunction;
  parent: AnyProposal | OffchainComment<any> | OffchainThread;
  proposal: AnyProposal | OffchainThread;
}

const ProposalComment: m.Component<IProposalCommentAttrs, IProposalCommentState> = {
  view: (vnode) => {
    const { comment, getSetGlobalEditingStatus, getSetGlobalReplyStatus, parent, proposal } = vnode.attrs;
    if (!comment) return;
    const parentType = comment.parentComment ? CommentParent.Comment : CommentParent.Proposal;
    const versionHistory = comment.versionHistory;
    const lastEdit = versionHistory?.length > 1 ? JSON.parse(versionHistory[0]) : null;

    const commentLink = `/${app.activeId()}/proposal/${proposal.slug}/`
      + `${proposal.identifier}-${slugify(proposal.title)}?comment=${comment.id}`;

    return m('.ProposalComment', {
      class: `${parentType}-child comment-${comment.id}`
    }, [
      m('.left-col', [
        m(User, { user: [comment.author, comment.authorChain], avatarOnly: true, avatarSize: 36, tooltip: true }),
      ]),
      m('.right-col', [
        m('.upper-meta', [
          m('.upper-meta-left', [
            m(User, { user: [comment.author, comment.authorChain], hideAvatar: true, linkify: true, tooltip: true }),
            m('a.comment-timestamp', {
              href: commentLink,
              onclick: (e) => {
                e.preventDefault();
                updateRoute(commentLink);
                jumpHighlightComment(comment.id, false, 500);
              }
            }, comment.createdAt.fromNow()),
            versionHistory.length > 1
            && m('a.last-edited', {
              href: '#',
              onclick: async (e) => {
                e.preventDefault();
                app.modals.create({
                  modal: VersionHistoryModal,
                  data: {
                    comment
                  }
                });
              }
            }, [
              'Edited ',
              moment(lastEdit.timestamp).fromNow()
            ])
          ]),
          m('.upper-meta-right', [
            app.vm.activeAccount
            && !getSetGlobalEditingStatus(GlobalStatus.Get)
            // For now, we are limiting threading to 1 level deep. Therefore, comments whose parents
            // are other comments do not display the option to reply
            && (parentType === CommentParent.Proposal)
            && m('a', {
              class: 'reply',
              href: '#',
              onclick: async (e) => {
                e.preventDefault();
                if (getSetGlobalReplyStatus(GlobalStatus.Get) && activeQuillEditorHasText()) {
                  const confirmed = await confirmationModalWithText('Unsubmitted replies will be lost. Continue?')();
                  if (!confirmed) return;
                }
                getSetGlobalReplyStatus(GlobalStatus.Set, comment.id);
              },
            }, parentType === CommentParent.Proposal ? 'Reply' : 'Reply to thread'),
            !getSetGlobalEditingStatus(GlobalStatus.Get)
            && !vnode.state.editing
            && (app.login.activeAddresses || []).findIndex((a) => a.address === comment.author) !== -1
            && m('a', {
              class: 'edit-comment',
              href: '#',
              onclick: async (e) => {
                e.preventDefault();
                vnode.state.editing = true;
                if (getSetGlobalReplyStatus(GlobalStatus.Get)) {
                  if (activeQuillEditorHasText()) {
                    const confirmed = await confirmationModalWithText('Unsubmitted replies will be lost. Continue?')();
                    if (!confirmed) return;
                  }
                  getSetGlobalReplyStatus(GlobalStatus.Set, false, true);
                }
                getSetGlobalEditingStatus(GlobalStatus.Set, true);
              },
            }, 'Edit'),
            app.vm.activeAccount
            && app.vm.activeAccount.address === comment.author
            && !vnode.state.editing
            && m('a', {
              href: '#',
              onclick: async (e) => {
                e.preventDefault();
                const confirmed = await confirmationModalWithText('Delete this comment?')();
                if (!confirmed) return;
                app.comments.delete(comment).then(() => {
                  m.redraw();
                  // TODO: set notification bar for 'comment deleted'
                });
              },
            }, 'Delete'),
            vnode.state.editing
            && m('a', {
              class: 'cancel-editing',
              href: '#',
              onclick: async (e) => {
                e.preventDefault();
                // TODO: Only show confirmation modal if edits have been made
                const confirmed = await confirmationModalWithText('Cancel editing? Changes will not be saved.')();
                if (!confirmed) return;
                vnode.state.editing = false;
                getSetGlobalEditingStatus(GlobalStatus.Set, false);
                m.redraw();
              }
            }, 'Cancel'),
            vnode.state.editing
            && m('a', {
              href: '#',
              onclick: (e) => {
                e.preventDefault();
                const commentText = vnode.state.quillEditorState.markdownMode
                  ? vnode.state.quillEditorState.editor.getText()
                  : JSON.stringify(vnode.state.quillEditorState.editor.getContents());
                app.comments.edit(comment, commentText)
                  .then((response) => {
                    vnode.state.editing = false;
                    getSetGlobalEditingStatus(GlobalStatus.Set, false);
                    m.redraw();
                    // TODO: set notification bar for 'thread edited' (?)
                  });
              }
            }, 'Save'),
          ]),
        ]),
        !vnode.state.editing
        && m('.proposal-comment-text', (() => {
          try {
            const doc = JSON.parse(comment.text);
            return m(QuillFormattedText, { doc });
          } catch (e) {
            return m(MarkdownFormattedText, { doc: comment.text });
          }
        })()),
        !vnode.state.editing
        && comment.attachments
        && comment.attachments.length > 0
        && m('.proposal-comment-attachments', [
          m('p', `Attachments (${comment.attachments.length})`),
          comment.attachments.map((attachment) => m('a.attachment-item', {
            href: attachment.url,
            title: attachment.description,
            target: '_blank',
            noopener: 'noopener',
            noreferrer: 'noreferrer',
            onclick: (e) => {
              e.preventDefault();
              lity(attachment.url);
            }
          }, [
            m('img', { src: attachment.url }),
          ]))
        ]),
        vnode.state.editing
        && m(QuillEditor, {
          contentsDoc: (() => {
            try {
              return JSON.parse(comment.text);
            } catch (e) {
              return comment.text;
            }
          })(),
          oncreateBind: (state) => {
            vnode.state.quillEditorState = state;
          },
          tabindex: 1,
          theme: 'snow',
          editorNamespace: document.location.pathname + '-editing-comment-' + comment.id,
        }),
      ]),
    ]);
  }
};

interface ICreateCommentAttrs {
  callback: CallableFunction;
  cancellable?: boolean;
  getSetGlobalEditingStatus: CallableFunction;
  getSetGlobalReplyStatus: CallableFunction;
  parentComment?: OffchainComment<any>;
  rootProposal: AnyProposal | OffchainThread;
}

interface ICreateCommentState {
  quillEditorState: any;
  uploadsInProgress;
  error;
  sendingComment;
}

const CreateComment: m.Component<ICreateCommentAttrs, ICreateCommentState> = {
  view: (vnode) => {
    const {
      callback,
      cancellable,
      getSetGlobalEditingStatus,
      getSetGlobalReplyStatus,
      rootProposal
    } = vnode.attrs;
    let { parentComment } = vnode.attrs;
    const author = app.vm.activeAccount;
    const parentType = parentComment ? CommentParent.Comment : CommentParent.Proposal;
    if (!parentComment) parentComment = null;
    if (vnode.state.uploadsInProgress === undefined) {
      vnode.state.uploadsInProgress = 0;
    }

    const submitComment = async (e?) => {
      if (!vnode.state.quillEditorState || !vnode.state.quillEditorState.editor) {
        if (e) e.preventDefault();
        vnode.state.error = 'Editor not initialized, please try again';
        return;
      }
      if (vnode.state.quillEditorState.editor.editor.isBlank()) {
        if (e) e.preventDefault();
        vnode.state.error = 'Comment cannot be blank';
        return;
      }

      const mentionsEle = document.getElementsByClassName('ql-mention-list-container')[0];
      if (mentionsEle) (mentionsEle as HTMLElement).style.visibility = 'hidden';

      const { quillEditorState } = vnode.state;

      const commentText = quillEditorState.markdownMode
        ? quillEditorState.editor.getText()
        : JSON.stringify(quillEditorState.editor.getContents());
      const mentions = !quillEditorState
        ? null
        : quillEditorState.markdownMode
          ? parseMentionsForServer(quillEditorState.editor.getText(), true)
          : parseMentionsForServer(quillEditorState.editor.getContents(), false);

      const attachments = [];
      // const attachments = vnode.state.files ?
      //   vnode.state.files.map((f) => f.uploadURL.replace(/\?.*/, '')) : [];

      vnode.state.error = null;
      vnode.state.sendingComment = true;
      const chainId = app.activeCommunityId() ? null : app.activeChainId();
      const communityId = app.activeCommunityId();
      try {
        const res = await app.comments.create(author.address, rootProposal.uniqueIdentifier,
          chainId, communityId, commentText, parentComment?.id, attachments, mentions);
        callback();
        if (vnode.state.quillEditorState.editor) {
          vnode.state.quillEditorState.editor.setContents();
          vnode.state.quillEditorState.clearUnsavedChanges();
        }
        vnode.state.sendingComment = false;
        // TODO: Instead of completely refreshing notifications, just add the comment to subscriptions
        // once we are receiving notifications from the websocket
        await app.login.notifications.refresh();
        m.redraw();
      } catch (err) {
        vnode.state.error = err.message;
        vnode.state.sendingComment = false;
        m.redraw();
      }

      mixpanel.track('Proposal Funnel', {
        'Step No': 2,
        'Step': 'Create Comment',
        'Proposal Name': `${(rootProposal).slug}: ${(rootProposal).identifier}`,
        'Scope': app.activeId(),
      });
      mixpanel.people.increment('Comment');
      mixpanel.people.set({
        'Last Comment Created': new Date().toISOString()
      });

      getSetGlobalReplyStatus(GlobalStatus.Set, false, true);
    };

    const { error, sendingComment, uploadsInProgress } = vnode.state;

    return m('.CreateComment', {
      class: parentType === CommentParent.Comment ? 'new-comment-child' : 'new-thread-child'
    }, [
      m('.left-col', m(User, { user: author, avatarOnly: true, avatarSize: 36, tooltip: true })),
      m('.right-col', [
        m('.upper-meta', [
          m('.upper-meta-left', [
            parentType === CommentParent.Comment
              ? m('span', [
                m('span.icon-reply'),
                'Replying',
              ])
              : m(User, { user: author, hideAvatar: true, linkify: true, tooltip: true }),
          ]),
        ]),
        m(QuillEditor, {
          contentsDoc: '',
          oncreateBind: (state) => {
            vnode.state.quillEditorState = state;
          },
          editorNamespace: document.location.pathname + '-commenting',
          onkeyboardSubmit: submitComment,
        }),
        m('.form-bottom', [
          m('button', {
            type: 'submit',
            disabled: getSetGlobalEditingStatus(GlobalStatus.Get) || sendingComment || uploadsInProgress > 0,
            onclick: submitComment
          }, (uploadsInProgress > 0)
            ? 'Uploading...'
            : parentType === CommentParent.Proposal ? 'Post comment' : 'Post reply'),
          cancellable
          && m('button', {
            type: 'cancel',
            onclick: (e) => {
              e.preventDefault();
              getSetGlobalReplyStatus(GlobalStatus.Set, false, true);
            }
          }, 'Cancel'),
          error
          && m('.new-comment-error', error),
        ]),
      ])
    ]);
  }
};

const CreateCommentPlaceholder: m.Component<{}> = {
  view: (vnode) => {
    return m('.CreateCommentPlaceholder', [
      m('p', [
        'Commonwealth is a platform for decentralized communities. ',
        app.isLoggedIn() ? 'Link an address to comment:' : 'Join the discussion:'
      ]),
      app.isLoggedIn() ? [
        m('a.btn.btn-block.formular-button-primary', {
          onclick: () => app.modals.create({ modal: LinkNewAddressModal }),
        }, `Link new ${(app.chain && app.chain.chain && app.chain.chain.denom) || ''} address`),
      ] : app.chain?.base == ChainBase.NEAR ? [
        m('a.btn.login-wallet-button.formular-button-black', {
          href: '#',
          onclick: (e) => {
            e.preventDefault();
            localStorage.setItem('nearPostAuthRedirect', JSON.stringify({
              timestamp: (+new Date()).toString(),
              path: m.route.get()
            }));

            // redirect to NEAR page for login
            const wallet = new WalletAccount((app.chain as Near).chain.api, null);
            if (wallet.isSignedIn()) {
              // get rid of pre-existing wallet info to make way for new account
              wallet.signOut();
            }
            const redirectUrl = `${window.location.origin}/${app.activeChainId()}/finishNearLogin`;
            wallet.requestSignIn('commonwealth', 'commonwealth', redirectUrl, redirectUrl);
          }
        }, [
          m('img.login-wallet-icon', { src: '/static/img/near_transparent_white.png' }),
          'Log in with NEAR',
        ]),
      ] : link('a.btn.formular-button-primary', '/login', 'Log in to comment'),
    ]);
  }
};

interface IProposalCommentsState {
  comments: Array<OffchainComment<any>>;
  commentError: any;
  dom;
  highlightedComment: boolean;
}

interface IProposalCommentsAttrs {
  proposal: OffchainThread | AnyProposal;
  getSetGlobalEditingStatus: CallableFunction;
  getSetGlobalReplyStatus: CallableFunction;
  replyParent: number | boolean;
  user?: any;
}

// TODO: clarify that 'user' = user who is commenting
const ProposalComments: m.Component<IProposalCommentsAttrs, IProposalCommentsState> = {
  oncreate: async (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    const chainId = app.activeCommunityId() ? null : app.activeChainId();
    const communityId = app.activeCommunityId();
    try {
      await app.comments.refresh(proposal, chainId, communityId);
      vnode.state.comments = app.comments.getByProposal(proposal)
        .filter((c) => c.parentComment === null);
      m.redraw();
    } catch (err) {
      console.log('Failed to load comments');
      vnode.state.comments = [];
      vnode.state.commentError = err.message;
      m.redraw();
    }
  },
  view: (vnode) => {
    const { proposal, getSetGlobalEditingStatus, getSetGlobalReplyStatus, replyParent } = vnode.attrs;
    vnode.state.comments = app.comments.getByProposal(proposal)
      .filter((c) => c.parentComment === null);

    // Jump to the comment indicated in the URL upon page load. Avoid
    // using m.route.param('comment') because it may return stale
    // results from a previous page if route transition hasn't finished
    if (vnode.state.dom && vnode.state.comments?.length > 0 && !vnode.state.highlightedComment) {
      vnode.state.highlightedComment = true;
      const commentId = window.location.search.startsWith('?comment=')
        ? window.location.search.replace('?comment=', '')
        : null;
      if (commentId) jumpHighlightComment(commentId);
    }

    const createdCommentCallback = () => {
      vnode.state.comments = app.comments.getByProposal(proposal)
        .filter((c) => c.parentComment === null);
      m.redraw();
    };

    const nestedReply = (comment, replyParent2) => {
      // if current comment is replyParent, & no posts are being edited, a nested comment form is rendered
      if (replyParent2 && comment.id === replyParent2 && !getSetGlobalEditingStatus(GlobalStatus.Get)) {
        return m(CreateComment, {
          callback: createdCommentCallback,
          cancellable: true,
          getSetGlobalEditingStatus,
          getSetGlobalReplyStatus,
          parentComment: comment,
          rootProposal: proposal
        });
      }
    };

    const recursivelyGatherChildComments = (comment, replyParent2) => {
      return comment.childComments.map((id) => {
        const child = app.comments.getById(id);
        if (!child) return;
        return m('.threading-level', [
          m(ProposalComment, {
            comment: child,
            getSetGlobalEditingStatus,
            getSetGlobalReplyStatus,
            parent: comment,
            proposal,
          }),
          !!child.childComments.length
            && m('.child-comments-wrap', recursivelyGatherChildComments(child, replyParent2))
        ]);
      });
    };

    const AllComments = (comments, replyParent2) => {
      return comments.map((comment) => {
        return ([
          m(ProposalComment, {
            comment,
            getSetGlobalEditingStatus,
            getSetGlobalReplyStatus,
            parent: proposal,
            proposal,
          }),
          // if comment has children, they are fetched & rendered
          !!comment.childComments.length
            && m('.child-comments-wrap', recursivelyGatherChildComments(comment, replyParent2)),
          replyParent2
            && replyParent2 === comment.id
            && nestedReply(comment, replyParent2),
        ]);
      });
    };

    const { commentError, comments } = vnode.state;
    return m('.ProposalComments', {
      oncreate: (vnode2) => { vnode.state.dom = vnode2.dom; }
    }, [
      // show loading spinner
      comments === undefined
      && !commentError
      && m('.loading-comments', [ 'Loading comments...', m('span.icon-spinner2.animate-spin') ]),
      // show comments
      comments
      && m('.proposal-comments', AllComments(comments, replyParent)),
      // create comment
      app.vm.activeAccount
      && !getSetGlobalReplyStatus(GlobalStatus.Get)
      && m(CreateComment, {
        callback: createdCommentCallback,
        cancellable: false,
        getSetGlobalEditingStatus,
        getSetGlobalReplyStatus,
        rootProposal: proposal,
      }),
      // logged-out cta
      !app.vm.activeAccount
      && m(CreateCommentPlaceholder),
      // errors
      commentError
      && m('.comments-error', commentError),
    ]);
  }
};

const Sidebar: m.Component<ISidebarAttrs> = {
  view: (vnode: m.VnodeDOM<ISidebarAttrs>) => {
    const { isThread, nComments, nVoters, proposal } = vnode.attrs;
    const comments = app.comments.getByProposal(proposal)
      .filter((c) => c.parentComment === null);
    const grabProfile = (address) => {
      return app.profiles.getProfile(app.activeId(), address);
    };
    const authors = [...new Set(comments.map((comment) => grabProfile(comment.author)))];

    // TODO: Bring back sidebar and "Go to comments" later"
    // const headerEle = document.getElementsByClassName('ProposalHeader')[0];
    // const bodyEle = document.getElementsByClassName('ProposalBody')[0];
    // const parentHeight =  headerEle && bodyEle ? headerEle.clientHeight + bodyEle.clientHeight + 48 : undefined;
    // const commentsOffScreen = parentHeight > window.innerHeight;

    return isThread ?
      // m('.Sidebar.ThreadSidebar.forum-container.proposal-sidebar', [
      //   comments.length && m('p.commenters', [
      //     pluralize(nComments, 'comment') + ' by ',
      //     authors.slice(0, 3).map((author) => m(User, { user: author }),
      //     authors.length > 3 && 'and ' + pluralize((authors.length - 3) , 'other'),
      //     commentsOffScreen && ' ',
      //     commentsOffScreen && m('a', { href: '#ProposalComments' }, 'Go to comments')
      //   ])
      // ]) :
      null :
      m('.Sidebar.ProposalSidebar.forum-container.proposal-sidebar', [
        getSupportText(proposal)
        && m('.proposal-row-support', getSupportText(proposal)),
        // getTurnoutText(proposal) && m('.proposal-row-turnout', getTurnoutText(proposal)),
        // getTurnoutBulletStyle(proposal) && m('.proposal-row-turnout-bullet', [
        //   m('.proposal-row-turnout-bullet-inner', { style: getTurnoutBulletStyle(proposal) })
        // ]),
        m(ProposalVotingActions, { proposal }),
        m('.h3', `Voters (${nVoters})`),
        m(ProposalVotingResults, { proposal }),
      ]);
  }
};

const ViewProposalPage: m.Component<IViewProposalPageAttrs, IViewProposalPageState> = {
  oncreate: (vnode: m.VnodeDOM<IViewProposalPageAttrs, IViewProposalPageState>) => {
    mixpanel.track('PageVisit', { 'Page Name': 'ViewProposalPage' });
    if (!vnode.state.editing) { vnode.state.editing = false; }
  },
  view: (vnode: m.VnodeDOM<IViewProposalPageAttrs, IViewProposalPageState>) => {
    const { identifier, type } = vnode.attrs;
    if (typeof identifier !== 'string') return m(PageNotFound);
    const proposalId = identifier.split('-')[0];
    const proposalType = type;

    if (!app.threads.initialized) {
      return m(PageLoading);
    }

    let proposal: AnyProposal;
    try {
      proposal = idToProposal(proposalType, proposalId);
    } catch (e) {
      // proposal might be loading, if it's not an offchain thread
      if (proposalType !== ProposalType.OffchainThread && !app.chain.loaded) {
        return m(PageLoading);
      }
      // proposal does not exist, 404
      return m(PageNotFound);
    }
    if (identifier !== `${proposalId}-${slugify(proposal.title)}`) {
      m.route.set(`/${app.activeId()}/proposal/${proposal.slug}/${proposalId}-${slugify(proposal.title)}`, {},
        { replace: true });
    }

    if (!vnode.state.mixpanelExecuted) {
      vnode.state.mixpanelExecuted = true;
      mixpanel.track('Proposal Funnel', {
        'Step No': 1,
        'Step': 'Viewing Proposal',
        'Proposal Name': `${proposal.slug}: ${proposal.identifier}`,
        'Scope': app.activeId(),
      });
    }

    // fetch completed cosmos proposal votes only when we load the page
    // if (proposal instanceof CosmosProposal && proposal.completed) {
    //   proposal.fetchVotes().then(() => m.redraw());
    // }

    const nComments : number = app.comments.nComments(proposal);
    const nVoters : number = proposal instanceof OffchainThread ? 0 : proposal.getVotes().length;
    const author : Account<any> = proposal instanceof OffchainThread
      ? (!app.community)
        ? app.chain.accounts.get(proposal.author)
        : app.community.accounts.get(proposal.author, proposal.authorChain)
      : proposal.author;
    const isThread = !!(proposal instanceof OffchainThread);

    const hasBody: boolean = proposal instanceof OffchainThread
      ? (proposal as OffchainThread).body && (() => {
        const body = (proposal as OffchainThread).body;
        try {
          const doc = JSON.parse(body);
          return !(doc.ops.length === 1 && doc.ops[0].insert.trim() === '');
        } catch (e) {
          return (`${body}`).trim() !== '';
        }
      })()
      : !!(proposal as AnyProposal).description;

    const getSetGlobalEditingStatus = (call: string, status?: boolean) => {
      if (call === GlobalStatus.Get) return vnode.state.editing;
      if (call === GlobalStatus.Set && status !== undefined) {
        vnode.state.editing = status;
        m.redraw();
      }
    };

    const getSetGlobalReplyStatus = (call: string, parentId?: number | boolean, suppressScrollToForm?: boolean) => {
      if (call === GlobalStatus.Get) return vnode.state.replyParent;
      if (call === GlobalStatus.Set) {
        vnode.state.replyParent = parentId;
        m.redraw.sync();

        // if we are canceling out of a reply, don't scroll to the newly restored reply form
        if (suppressScrollToForm) return;

        // scroll to new reply form if parentId is available, scroll to proposal-level comment form otherwise
        setTimeout(() => {
          const $reply = parentId ?
            $(`.comment-${parentId}`).nextAll('.CreateComment') :
            $('.ProposalComments > .CreateComment');

          // if the reply is at least partly offscreen, scroll it entirely into view
          const scrollTop = $('html, body').scrollTop();
          const replyTop = $reply.offset().top;
          if (scrollTop + $(window).height() < replyTop + $reply.outerHeight())
            $('html, body').animate({ scrollTop: replyTop + $reply.outerHeight() - $(window).height() + 40 }, 500);

          // highlight the reply form
          const animationDelayTime = 2000;
          $reply.addClass('highlighted');
          setTimeout(() => {
            $reply.removeClass('highlighted');
          }, animationDelayTime + 500);

          // focus the reply form
          $reply.find('.ql-editor').focus();
        }, 1);
      }
    };

    const { replyParent } = vnode.state;
    return m(ListingPage, {
      class: 'ViewProposalPage',
      title: proposalType === 'discussion' ? 'Discussions' : 'Governance Proposals',
      subtitle: proposalType === 'discussion' ? 'Discuss proposals and improvements' : 'Vote on network changes',
      content: m('.row.row-narrow', [
        m('.col-sm-9.col-md-8', [
          m(ProposalHeader, { author, isThread, nComments, proposal }),
          hasBody
          && m(ProposalBody, {
            author,
            isThread,
            proposal,
            getSetGlobalEditingStatus,
            getSetGlobalReplyStatus
          }),
          m(ProposalComments, {
            proposal,
            getSetGlobalEditingStatus,
            getSetGlobalReplyStatus,
            replyParent
          }),
        ]),
        m('.col-sm-3.col-md-4', m(Sidebar, { isThread, nComments, nVoters, proposal })),
      ]),
    });
  }
};

export default ViewProposalPage;
