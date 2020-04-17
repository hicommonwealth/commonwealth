import 'pages/view_proposal/index.scss';

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
import { isRoleOfCommunity } from 'helpers/roles';

import { CommentParent } from 'controllers/server/comments';
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
import User from 'views/components/widgets/user';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import LinkNewAddressModal from 'views/modals/link_new_address_modal';
import PreviewModal from 'views/modals/preview_modal';
import PageLoading from 'views/pages/loading';
import PageNotFound from 'views/pages/404';
import { SubstrateTreasuryProposal } from 'controllers/chain/substrate/treasury';
import { formatCoin } from 'adapters/currency';
import VersionHistoryModal from 'views/modals/version_history_modal';

import { ProposalHeaderAuthor, ProposalHeaderCreated, ProposalHeaderComments, ProposalHeaderDelete, ProposalHeaderExternalLink, ProposalHeaderLastEdited, ProposalHeaderTags, ProposalHeaderTitle, ProposalHeaderOnchainId, ProposalHeaderOnchainStatus, ProposalHeaderSpacer, ProposalHeaderViewCount, ProposalHeaderSubscriptionButton } from './header';
import { GlobalStatus, ProposalBodyAuthor, ProposalBodyCreated, ProposalBodyLastEdited, ProposalBodyReply, ProposalBodyEdit, ProposalBodyDelete, ProposalBodyCancelEdit, ProposalBodySaveEdit, ProposalBodySpacer, ProposalBodyText, ProposalBodyAttachments, ProposalBodyEditor } from './body';
import CreateComment from './create_comment';


interface IProposalHeaderAttrs {
  commentCount: number;
  viewCount: number;
  getSetGlobalEditingStatus: CallableFunction;
  getSetGlobalReplyStatus: CallableFunction;
  proposal: AnyProposal | OffchainThread;
}

interface IProposalHeaderState {
  editing: boolean;
  quillEditorState: any;
}

const ProposalHeader: m.Component<IProposalHeaderAttrs, IProposalHeaderState> = {
  view: (vnode) => {
    const { commentCount, proposal, getSetGlobalEditingStatus, getSetGlobalReplyStatus, viewCount } = vnode.attrs;
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

    return m('.ProposalHeader', {
      class: `proposal-${proposal.slug}`
    }, [
      m('.proposal-header', [
        m('.proposal-header-meta', [
          m(ProposalHeaderTags, { proposal }),
          proposal instanceof OffchainThread && (proposal.tags?.length > 0 ||
                                                 (app.vm.activeAccount?.address === (proposal as OffchainThread).author) ||
                                                 isRoleOfCommunity(app.vm.activeAccount, app.login.addresses,
                                                                   app.login.roles, 'admin', app.activeId())) && m(ProposalHeaderSpacer),
          m(ProposalHeaderViewCount, { viewCount }),
          m(ProposalHeaderDelete, { proposal }),
        ]),
        m('.proposal-title', [
          m(ProposalHeaderTitle, { proposal }),
          m(ProposalHeaderComments, { proposal, commentCount }),
        ]),
        m('.proposal-subscription-button', [
          m(ProposalHeaderSubscriptionButton, { proposal }),
        ]),
      ]),
      proposal instanceof OffchainThread && m('.proposal-body', [
        m('.proposal-body-meta', proposal instanceof OffchainThread ? [
          m(ProposalHeaderAuthor, { proposal }),
          m(ProposalHeaderSpacer),
          m(ProposalHeaderCreated, { proposal, link: proposalLink }),
          proposal instanceof OffchainThread && proposal.versionHistory?.length > 1 && m(ProposalHeaderSpacer),
          m(ProposalHeaderLastEdited, { proposal }),

          !getSetGlobalEditingStatus(GlobalStatus.Get)
            && isSameAccount(app.vm.activeAccount, author)
            && !vnode.state.editing
            && [
              m(ProposalHeaderSpacer),
              m(ProposalBodyEdit, { item: proposal, getSetGlobalReplyStatus, getSetGlobalEditingStatus, parentState: vnode.state }),
              m(ProposalHeaderSpacer),
              m(ProposalBodyDelete, { item: proposal }),
            ],

          vnode.state.editing && [
            m(ProposalHeaderSpacer),
            m(ProposalBodyCancelEdit, { getSetGlobalEditingStatus, parentState: vnode.state }),
            m(ProposalHeaderSpacer),
            m(ProposalBodySaveEdit, { item: proposal, getSetGlobalEditingStatus, parentState: vnode.state }),
          ],

          proposal instanceof OffchainThread && proposal.kind === OffchainThreadKind.Link && m(ProposalHeaderSpacer),
          m(ProposalHeaderExternalLink, { proposal }),
        ] : [
          m(ProposalHeaderOnchainId, { proposal }),
          m(ProposalHeaderOnchainStatus, { proposal }),
          m(ProposalHeaderAuthor, { proposal }),
          m(ProposalHeaderCreated, { proposal, link: proposalLink }),
        ]),
        m('.proposal-body-content', [
          !vnode.state.editing
            && m(ProposalBodyText, { item: proposal }),

          !vnode.state.editing
            && attachments
            && attachments.length > 0
            && m(ProposalBodyAttachments, { item: proposal }),

          vnode.state.editing
            && m(ProposalBodyEditor, { item: proposal, parentState: vnode.state }),
        ]),
      ]),
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
      m('.comment-body-meta', [
        m(ProposalBodyAuthor, { comment }),
        m(ProposalBodySpacer),
        m(ProposalBodyCreated, { item: comment, link: commentLink }),
        comment.versionHistory?.length > 1 && m(ProposalBodySpacer),
        m(ProposalBodyLastEdited, { item: comment }),

        !vnode.state.editing
          && app.vm.activeAccount
          && !getSetGlobalEditingStatus(GlobalStatus.Get)
          && isSameAccount(app.vm.activeAccount, comment.author)
          && [
            m(ProposalBodySpacer),
            m(ProposalBodyEdit, { item: comment, getSetGlobalReplyStatus, getSetGlobalEditingStatus, parentState: vnode.state }),
            m(ProposalBodyDelete, { item: comment }),
          ],

        // For now, we are limiting threading to 1 level deep, so comments whose parents are other comments do not display the option to reply
        !vnode.state.editing
          && app.vm.activeAccount
          && !getSetGlobalEditingStatus(GlobalStatus.Get)
          && parentType === CommentParent.Proposal && [
            m(ProposalBodySpacer),
            m(ProposalBodyReply, { item: comment, getSetGlobalReplyStatus, parentType }),
          ],

        vnode.state.editing && [
          m(ProposalBodySpacer),
          m(ProposalBodyCancelEdit, { getSetGlobalEditingStatus, parentState: vnode.state }),
          m(ProposalBodySpacer),
          m(ProposalBodySaveEdit, { item: comment, getSetGlobalEditingStatus, parentState: vnode.state }),
        ],
      ]),
      m('.comment-body-content', [
        !vnode.state.editing
          && m(ProposalBodyText, { item: comment }),

        !vnode.state.editing
          && comment.attachments
          && comment.attachments.length > 0
          && m(ProposalBodyAttachments, { item: comment }),

        vnode.state.editing
          && m(ProposalBodyEditor, { item: comment, parentState: vnode.state }),
      ]),
    ]);
  }
};

interface IProposalCommentsState {
  commentError: any;
  dom;
  highlightedComment: boolean;
}

interface IProposalCommentsAttrs {
  proposal: OffchainThread | AnyProposal;
  comments: Array<OffchainComment<any>>;
  createdCommentCallback: CallableFunction;
  getSetGlobalEditingStatus: CallableFunction;
  getSetGlobalReplyStatus: CallableFunction;
  replyParent: number | boolean;
  user?: any;
}

// TODO: clarify that 'user' = user who is commenting
const ProposalComments: m.Component<IProposalCommentsAttrs, IProposalCommentsState> = {
  view: (vnode) => {
    const { proposal, comments, createdCommentCallback, getSetGlobalEditingStatus, getSetGlobalReplyStatus, replyParent } = vnode.attrs;

    // Jump to the comment indicated in the URL upon page load. Avoid
    // using m.route.param('comment') because it may return stale
    // results from a previous page if route transition hasn't finished
    if (vnode.state.dom && comments?.length > 0 && !vnode.state.highlightedComment) {
      vnode.state.highlightedComment = true;
      const commentId = window.location.search.startsWith('?comment=')
        ? window.location.search.replace('?comment=', '')
        : null;
      if (commentId) jumpHighlightComment(commentId);
    }

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

    return m('.ProposalComments', {
      oncreate: (vnode2) => { vnode.state.dom = vnode2.dom; }
    }, [
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
      vnode.state.commentError
        && m('.comments-error', vnode.state.commentError),
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

const ViewProposalPage: m.Component<{ identifier: string, type: string }, { editing: boolean, replyParent: number | boolean, highlightedComment: boolean, commentsPrefetchStarted: boolean, comments, viewCountPrefetchStarted: boolean, viewCount: number, profilesPrefetchStarted: boolean }> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': 'ViewProposalPage' });
    mixpanel.track('Proposal Funnel', {
      'Step No': 1,
      'Step': 'Viewing Proposal',
      'Proposal Name': `${vnode.attrs.type}: ${vnode.attrs.identifier}`,
      'Scope': app.activeId(),
    });
    if (!vnode.state.editing) { vnode.state.editing = false; }
  },
  view: (vnode) => {
    const { identifier, type } = vnode.attrs;
    if (typeof identifier !== 'string') return m(PageNotFound);
    const proposalId = identifier.split('-')[0];
    const proposalType = type;

    // load app controller
    if (!app.threads.initialized) {
      return m(PageLoading);
    }

    // load proposal
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

    // load comments
    if (!vnode.state.commentsPrefetchStarted) {
      (app.activeCommunityId()
       ? app.comments.refresh(proposal, null, app.activeCommunityId())
       : app.comments.refresh(proposal, app.activeChainId(), null))
        .then((result) => {
          vnode.state.comments = app.comments.getByProposal(proposal).filter((c) => c.parentComment === null);
          m.redraw();
        }).catch((err) => {
          throw new Error('Failed to load comments');
          vnode.state.comments = [];
          m.redraw();
        });
      vnode.state.commentsPrefetchStarted = true;
    }
    const createdCommentCallback = () => {
      vnode.state.comments = app.comments.getByProposal(proposal).filter((c) => c.parentComment === null);
      m.redraw();
    };

    // load view count
    if (!vnode.state.viewCountPrefetchStarted && proposal instanceof OffchainThread) {
      $.post(`${app.serverUrl()}/viewCount`, {
        chain: app.activeChainId(),
        community: app.activeCommunityId(),
        object_id: proposal.id, // (proposal instanceof OffchainThread) ? proposal.id : proposal.slug,
      }).then((response) => {
        if (response.status !== 'Success') {
          vnode.state.viewCount = 0;
          throw new Error('got unsuccessful status: ' + response.status);
        } else {
          vnode.state.viewCount = response.result.view_count;
          m.redraw();
        }
      }).catch(() => {
        vnode.state.viewCount = 0;
        throw new Error('could not load view count');
      });
      vnode.state.viewCountPrefetchStarted = true;
    } else if (!vnode.state.viewCountPrefetchStarted) {
      // view counts currently not supported for proposals
      vnode.state.viewCountPrefetchStarted = true;
      vnode.state.viewCount = 0;
    }

    if (vnode.state.comments === undefined) {
      return m(PageLoading);
    }
    if (vnode.state.viewCount === undefined) {
      return m(PageLoading);
    }

    // load profiles
    // TODO: recursively fetch child comments as well (this will also prevent a reloading flash for threads with child comments)
    if (vnode.state.profilesPrefetchStarted === undefined) {
      if (proposal instanceof OffchainThread) {
        app.profiles.getProfile(proposal.authorChain, proposal.author);
      } else if (proposal.author instanceof Account) { // AnyProposal
        app.profiles.getProfile(proposal.author.chain.id, proposal.author.address);
      }
      vnode.state.comments.map((comment) => {
        app.profiles.getProfile(comment.authorChain, comment.author);
      });
      vnode.state.profilesPrefetchStarted = true;
    }
    if (!app.profiles.allLoaded()) {
      return m(PageLoading);
    }

    // fetch completed cosmos proposal votes only when we load the page
    // if (proposal instanceof CosmosProposal && proposal.completed) {
    //   proposal.fetchVotes().then(() => m.redraw());
    // }

    const comments = vnode.state.comments;
    const viewCount : number = vnode.state.viewCount;
    const commentCount : number = app.comments.nComments(proposal);
    const voterCount : number = proposal instanceof OffchainThread ? 0 : proposal.getVotes().length;

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
          const scrollTop = $('.mithril-app').scrollTop();
          const replyTop = $reply.offset().top;
          if (scrollTop + $(window).height() < replyTop + $reply.outerHeight())
            $('.mithril-app').animate({ scrollTop: replyTop + $reply.outerHeight() - $(window).height() + 40 }, 500);

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
    return m('.ViewProposalPage', [
      m(ProposalHeader, { proposal, commentCount, viewCount, getSetGlobalEditingStatus, getSetGlobalReplyStatus }),
      m(ProposalComments, { proposal, comments, createdCommentCallback, replyParent, getSetGlobalEditingStatus, getSetGlobalReplyStatus }),
      m(ProposalSidebar, { proposal }),
    ]);
  }
};

export default ViewProposalPage;
