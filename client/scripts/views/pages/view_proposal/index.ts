import 'pages/view_proposal.scss';

import $ from 'jquery';
import m from 'mithril';
import moment from 'moment';
import mixpanel from 'mixpanel-browser';
import lity from 'lity';

import Near from 'controllers/chain/near/main';
import { WalletAccount } from 'nearlib';

import app, { LoginState } from 'state';
import { idToProposal, ProposalType } from 'identifiers';
import { pluralize, slugify, symbols, link, externalLink, isSameAccount } from 'helpers';

import { ProposalHeaderAuthor, ProposalHeaderCreated, ProposalHeaderComments, ProposalHeaderDelete, ProposalHeaderExternalLink, ProposalHeaderTags, ProposalHeaderTitle, ProposalHeaderOnchainId, ProposalHeaderOnchainStatus, ProposalHeaderSubscriptionButton } from './header';
import { GlobalStatus, ProposalBodyCreated, ProposalBodyLastEdited, ProposalBodyReply, ProposalBodyEdit, ProposalBodyDelete, ProposalBodyCancelEdit, ProposalBodySaveEdit, ProposalBodyText, ProposalBodyAttachments, ProposalBodyEditor } from './body';

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
  ChainBase,
  OffchainTag
} from 'models';

import { jumpHighlightComment } from 'views/pages/view_proposal/jump_to_comment';
import ReactionButton, { ReactionType } from 'views/components/reaction_button';
import ProposalVotingActions from 'views/components/proposals/voting_actions';
import ProposalVotingResults from 'views/components/proposals/voting_results';
import Tabs from 'views/components/widgets/tabs';
import QuillEditor from 'views/components/quill_editor';
import QuillFormattedText from 'views/components/quill_formatted_text';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import ProfileBlock from 'views/components/widgets/profile_block';
import ViewCountBlock from 'views/components/widgets/view_count_block';
import User from 'views/components/widgets/user';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import LinkNewAddressModal from 'views/modals/link_new_address_modal';
import PreviewModal from 'views/modals/preview_modal';
import ListingPage from 'views/pages/_listing_page';
import PageLoading from 'views/pages/loading';
import PageNotFound from 'views/pages/404';
import { SubstrateTreasuryProposal } from 'controllers/chain/substrate/treasury';
import { formatCoin } from 'adapters/currency';
import { parseMentionsForServer } from 'views/pages/threads';
import VersionHistoryModal from 'views/modals/version_history_modal';

const ProposalHeader: m.Component<{ isThread: boolean, nComments: number, proposal: any }> = {
  view: (vnode) => {
    const { isThread, nComments, proposal } = vnode.attrs;

    return m('.ProposalHeader', {
      class: `proposal-${proposal.slug}`
    }, [
      isThread && m(ProposalHeaderTags, { proposal: proposal as OffchainThread }),
      m(ProposalHeaderTitle, { proposal }),
      isThread
        ? m('.proposal-meta', [
          m(ProposalHeaderAuthor, { proposal }),
          m(ProposalHeaderCreated, { proposal }),
          m(ProposalHeaderComments, { proposal, nComments }),
          m(ProposalHeaderDelete, { proposal }),
          m(ViewCountBlock, { proposal }),
        ])
        : m('.proposal-meta', [
          m(ProposalHeaderOnchainId, { proposal }),
          m(ProposalHeaderOnchainStatus, { proposal }),
          m(ProposalHeaderAuthor, { proposal }),
          m(ProposalHeaderCreated, { proposal }),
        ]),
      m(ProposalHeaderExternalLink, { proposal }),
      m(ProposalHeaderSubscriptionButton, { proposal }),
    ]);
  }
};

export const ProposalBody: m.Component<{ getSetGlobalEditingStatus: any, getSetGlobalReplyStatus: CallableFunction, proposal: AnyProposal | OffchainThread }, { editing: boolean, quillEditorState: any }> = {
  view: (vnode) => {
    const { getSetGlobalEditingStatus, getSetGlobalReplyStatus, proposal } = vnode.attrs;
    const isThread = proposal instanceof OffchainThread;
    const description = isThread ? false : (proposal as AnyProposal).description;
    const body = isThread ? (proposal as OffchainThread).body : false;
    const attachments = isThread ? (proposal as OffchainThread).attachments : false;
    const versionHistory = (proposal as OffchainThread).versionHistory;
    const lastEdit = versionHistory?.length > 1 ? JSON.parse(versionHistory[0]) : null;
    const proposalLink = `/${app.activeId()}/proposal/${proposal.slug}/${proposal.identifier}-${slugify(proposal.title)}`;

    const author : Account<any> = proposal instanceof OffchainThread
      ? (!app.community)
      ? app.chain.accounts.get(proposal.author)
      : app.community.accounts.get(proposal.author, proposal.authorChain)
    : proposal.author;

    return m('.ProposalBody', {
      class: `proposal-${proposal.slug}`
    }, [
      m('.proposal-body-header', [
        proposal instanceof OffchainThread && [
          m(ProposalBodyCreated, { item: proposal, link: proposalLink }),
          isThread && m(ProposalBodyLastEdited, { item: proposal }),
        ],

        app.vm.activeAccount
          && !getSetGlobalEditingStatus(GlobalStatus.Get)
          && !vnode.state.editing
          && m(ProposalBodyReply, { item: proposal, getSetGlobalReplyStatus }),

        proposal instanceof OffchainThread
          && !getSetGlobalEditingStatus(GlobalStatus.Get)
          && isSameAccount(app.vm.activeAccount, author)
          && !vnode.state.editing
          && m(ProposalBodyEdit, { item: proposal, getSetGlobalReplyStatus, getSetGlobalEditingStatus, parentState: vnode.state }),

        proposal instanceof OffchainThread
          && !getSetGlobalEditingStatus(GlobalStatus.Get)
          && isSameAccount(app.vm.activeAccount, author)
          && !vnode.state.editing
          && m(ProposalBodyDelete, { item: proposal }),

        proposal instanceof OffchainThread
          && vnode.state.editing
          && m(ProposalBodyCancelEdit, { getSetGlobalEditingStatus, parentState: vnode.state }),
        proposal instanceof OffchainThread
          && vnode.state.editing
          && m(ProposalBodySaveEdit, { item: proposal, getSetGlobalEditingStatus, parentState: vnode.state }),
      ]),

      proposal instanceof OffchainThread && [
        !vnode.state.editing
          && m(ProposalBodyText, { item: proposal }),

        !vnode.state.editing
          && attachments
          && attachments.length > 0
          && m(ProposalBodyAttachments, { item: proposal }),

        vnode.state.editing
          && m(ProposalBodyEditor, { item: proposal, parentState: vnode.state }),
      ],
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

    const commentLink = `/${app.activeId()}/proposal/${proposal.slug}/`
      + `${proposal.identifier}-${slugify(proposal.title)}?comment=${comment.id}`;

    return m('.ProposalComment', {
      class: `${parentType}-child comment-${comment.id}`
    }, [
      m('.proposal-body-header', [
        m(User, { user: [comment.author, comment.authorChain], linkify: true, tooltip: true }), // TODO
        m(ProposalBodyCreated, { item: comment, link: commentLink }),
        m(ProposalBodyLastEdited, { item: comment }),

        app.vm.activeAccount
          && !getSetGlobalEditingStatus(GlobalStatus.Get)
          && (parentType === CommentParent.Proposal)
          && !vnode.state.editing
          && m(ProposalBodyReply, { item: comment, getSetGlobalReplyStatus, parentType }),
        // For now, we are limiting threading to 1 level deep,
        // Therefore, comments whose parents are other comments
        // do not display the option to reply

        !getSetGlobalEditingStatus(GlobalStatus.Get)
          && (app.login.activeAddresses || []).findIndex((a) => a.address === comment.author) !== -1
          && !vnode.state.editing
          && m(ProposalBodyEdit, { item: comment, getSetGlobalReplyStatus, getSetGlobalEditingStatus, parentState: vnode.state }),

        !getSetGlobalEditingStatus(GlobalStatus.Get)
          && isSameAccount(app.vm.activeAccount, comment.author)
          && !vnode.state.editing
          && m(ProposalBodyDelete, { item: comment }),

        vnode.state.editing
          && m(ProposalBodyCancelEdit, { getSetGlobalEditingStatus, parentState: vnode.state }),
        vnode.state.editing
          && m(ProposalBodySaveEdit, { item: comment, getSetGlobalEditingStatus, parentState: vnode.state }),
      ]),

      !vnode.state.editing
        && m(ProposalBodyText, { item: comment }),

      !vnode.state.editing
        && comment.attachments
        && comment.attachments.length > 0
        && m(ProposalBodyAttachments, { item: comment }),

      vnode.state.editing
        && m(ProposalBodyEditor, { item: comment, parentState: vnode.state }),
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
      // errors
      commentError
      && m('.comments-error', commentError),
    ]);
  }
};

const ProposalSidebar: m.Component<{ proposal: AnyProposal }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (proposal instanceof OffchainThread) return;

    return m('.ProposalSidebar.forum-container.proposal-sidebar', [
      m(ProposalVotingActions, { proposal }),
      m(ProposalVotingResults, { proposal }),
    ]);
  }
};

const ViewProposalPage: m.Component<{ identifier: string, type: string }, { editing: boolean, replyParent: number | boolean, highlightedComment: boolean, mixpanelExecuted: boolean }> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': 'ViewProposalPage' });
    if (!vnode.state.editing) { vnode.state.editing = false; }
  },
  view: (vnode) => {
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
      content: [
        m(ProposalHeader, { isThread, nComments, proposal }),
        m(ProposalBody, { proposal, getSetGlobalEditingStatus, getSetGlobalReplyStatus }),
        m(ProposalComments, { proposal, getSetGlobalEditingStatus, getSetGlobalReplyStatus, replyParent }),
        m(ProposalSidebar, { proposal }),
      ],
    });
  }
};

export default ViewProposalPage;
