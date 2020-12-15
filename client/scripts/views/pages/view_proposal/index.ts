import 'pages/view_proposal/index.scss';

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { PopoverMenu, MenuDivider, Icon, Icons } from 'construct-ui';

import app from 'state';
import Sublayout from 'views/sublayout';
import { idToProposal, ProposalType, proposalSlugToClass } from 'identifiers';
import { slugify, isSameAccount } from 'helpers';

import { notifyError } from 'controllers/app/notifications';
import { CommentParent } from 'controllers/server/comments';
import {
  OffchainThread,
  OffchainThreadKind,
  OffchainComment,
  OffchainTopic,
  AnyProposal,
  Account,
  ChainBase,
  ProposalModule,
} from 'models';

import jumpHighlightComment from 'views/pages/view_proposal/jump_to_comment';
import TopicEditor from 'views/components/topic_editor';
import { TopicEditorButton, ThreadSubscriptionButton } from 'views/pages/discussions/discussion_row_menu';
import ProposalVotingActions from 'views/components/proposals/voting_actions';
import ProposalVotingResults from 'views/components/proposals/voting_results';
import User from 'views/components/widgets/user';
import PageLoading from 'views/pages/loading';
import PageNotFound from 'views/pages/404';

import {
  ProposalHeaderExternalLink, ProposalHeaderBlockExplorerLink, ProposalHeaderVotingInterfaceLink,
  ProposalHeaderTopics, ProposalHeaderTitle,
  ProposalHeaderOnchainId, ProposalHeaderOnchainStatus, ProposalHeaderSpacer, ProposalHeaderViewCount,
  ProposalHeaderPrivacyButtons,
  ProposalTitleEditor,
} from './header';
import {
  activeQuillEditorHasText, GlobalStatus, ProposalBodyAvatar, ProposalBodyAuthor, ProposalBodyCreated,
  ProposalBodyLastEdited, ProposalBodyEdit, ProposalBodyDelete, ProposalBodyCancelEdit,
  ProposalBodySaveEdit,  ProposalBodySpacer, ProposalBodyText, ProposalBodyAttachments, ProposalBodyEditor,
  ProposalBodyReaction, ProposalBodyEditMenuItem, ProposalBodyDeleteMenuItem, ProposalBodyReplyMenuItem
} from './body';
import CreateComment from './create_comment';

interface IProposalHeaderAttrs {
  commentCount: number;
  viewCount: number;
  getSetGlobalEditingStatus: CallableFunction;
  getSetGlobalReplyStatus: CallableFunction;
  proposal: AnyProposal | OffchainThread;
}

interface IProposalHeaderState {
  canEdit: boolean;
  isAdmin: boolean;
  savedEdit: string;
  editing: boolean;
  saving: boolean;
  quillEditorState: any;
  currentText: any;
  updatedTitle: string;
  topicEditorIsOpen: boolean;
}

const ProposalHeader: m.Component<IProposalHeaderAttrs, IProposalHeaderState> = {
  oninit: (vnode) => {
    const { proposal } = vnode.attrs;
    vnode.state.isAdmin = (app.user.isRoleOfCommunity({
      role: 'admin',
      chain: app.activeChainId(),
      community: app.activeCommunityId()
    }) || app.user.isRoleOfCommunity({
      role: 'moderator',
      chain: app.activeChainId(),
      community: app.activeCommunityId()
    }));
    vnode.state.canEdit = (app.user.activeAccount?.address === proposal.author
          && app.user.activeAccount?.chain.id === (proposal as OffchainThread).authorChain)
      || vnode.state.isAdmin;
  },
  view: (vnode) => {
    const { commentCount, proposal, getSetGlobalEditingStatus, getSetGlobalReplyStatus, viewCount } = vnode.attrs;
    const { canEdit, isAdmin } = vnode.state;
    const isThread = proposal instanceof OffchainThread;
    const attachments = isThread ? (proposal as OffchainThread).attachments : false;
    const versionHistory = (proposal as OffchainThread).versionHistory;
    const proposalLink = `/${app.activeId()}/proposal/${proposal.slug}/${proposal.identifier}-`
      + `${slugify(proposal.title)}`;
    const description = isThread ? false : (proposal as AnyProposal).description;
    const body = isThread ? (proposal as OffchainThread).body : false;
    const lastEdit = versionHistory?.length > 1 ? JSON.parse(versionHistory[0]) : null;
    const author : Account<any> = proposal instanceof OffchainThread
      ? (!app.community
        ? app.chain.accounts.get(proposal.author)
        : app.community.accounts.get(proposal.author, proposal.authorChain))
      : proposal.author;

    return m('.ProposalHeader', {
      class: `proposal-${proposal.slug}`
    }, [
      m('.proposal-top', [
        m('.proposal-top-left', [
          !vnode.state.editing
            && m('.proposal-title', m(ProposalHeaderTitle, { proposal })),
          vnode.state.editing
            && m(ProposalTitleEditor, { item: proposal, parentState: vnode.state }),
          m('.proposal-body-meta', proposal instanceof OffchainThread ? [
            m(ProposalHeaderTopics, { proposal }),
            m(ProposalBodyAuthor, { item: proposal }),
            m(ProposalBodyCreated, { item: proposal, link: proposalLink }),
            m(ProposalBodyLastEdited, { item: proposal }),
            m(ProposalHeaderViewCount, { viewCount }),
            app.isLoggedIn() && !getSetGlobalEditingStatus(GlobalStatus.Get) && m(PopoverMenu, {
              transitionDuration: 0,
              closeOnOutsideClick: true,
              closeOnContentClick: true,
              menuAttrs: { size: 'default' },
              content: [
                canEdit && m(ProposalBodyEditMenuItem, {
                  item: proposal, getSetGlobalReplyStatus, getSetGlobalEditingStatus, parentState: vnode.state,
                }),
                canEdit && m(ProposalBodyDeleteMenuItem, { item: proposal }),
                isAdmin && proposal instanceof OffchainThread && m(TopicEditorButton, {
                  openTopicEditor: () => {
                    vnode.state.topicEditorIsOpen = true;
                  }
                }),
                canEdit && m(ProposalHeaderPrivacyButtons, { proposal }),
                canEdit && m(MenuDivider),
                m(ThreadSubscriptionButton, { proposal: proposal as OffchainThread }),
              ],
              inline: true,
              trigger: m(Icon, { name: Icons.CHEVRON_DOWN }),
            }),
            vnode.state.topicEditorIsOpen && proposal instanceof OffchainThread && m(TopicEditor, {
              thread: vnode.attrs.proposal as OffchainThread,
              popoverMenu: true,
              onChangeHandler: (topic: OffchainTopic) => { proposal.topic = topic; m.redraw(); },
              openStateHandler: (v) => { vnode.state.topicEditorIsOpen = v; m.redraw(); },
            })
          ] : [
            m(ProposalHeaderOnchainId, { proposal }),
            m(ProposalHeaderOnchainStatus, { proposal }),
            m(ProposalBodyAuthor, { item: proposal }),
            m(ProposalHeaderViewCount, { viewCount }),
            m(ProposalBodyReaction, { item: proposal }),
          ]),
          proposal instanceof OffchainThread
            && proposal.kind === OffchainThreadKind.Link
            && m('.proposal-body-link', m(ProposalHeaderExternalLink, { proposal })),
          (proposal['blockExplorerLink'] || proposal['votingInterfaceLink']) && m('.proposal-body-link', [
            proposal['blockExplorerLink']
              && m(ProposalHeaderBlockExplorerLink, { proposal }),
            proposal['votingInterfaceLink']
              && m(ProposalHeaderVotingInterfaceLink, { proposal }),
          ]),
        ]),
      ]),
      proposal instanceof OffchainThread && m('.proposal-content', [
        (commentCount > 0 || app.user.activeAccount) && m('.thread-connector'),
        m('.proposal-content-left', [
          m(ProposalBodyAvatar, { item: proposal }),
        ]),
        m('.proposal-content-right', [
          !vnode.state.editing
            && m(ProposalBodyText, { item: proposal }),

          !vnode.state.editing
            && attachments
            && attachments.length > 0
            && m(ProposalBodyAttachments, { item: proposal }),

          vnode.state.editing
            && m(ProposalBodyEditor, { item: proposal, parentState: vnode.state }),

          vnode.state.editing
            && m('.proposal-body-button-group', [
              m(ProposalBodySaveEdit, { item: proposal, getSetGlobalEditingStatus, parentState: vnode.state }),
              m(ProposalBodyCancelEdit, { item: proposal, getSetGlobalEditingStatus, parentState: vnode.state }),
            ]),

          !vnode.state.editing
            && m(ProposalBodyReaction, { item: proposal }),
        ]),
      ]),
    ]);
  }
};

interface IProposalCommentState {
  editing: boolean;
  saving: boolean;
  replying: boolean;
  quillEditorState: any;
}

interface IProposalCommentAttrs {
  comment: OffchainComment<any>;
  getSetGlobalEditingStatus: CallableFunction;
  getSetGlobalReplyStatus: CallableFunction;
  parent: AnyProposal | OffchainComment<any> | OffchainThread;
  proposal: AnyProposal | OffchainThread;
  callback?: Function;
  isLast: boolean,
}

const ProposalComment: m.Component<IProposalCommentAttrs, IProposalCommentState> = {
  view: (vnode) => {
    const {
      comment,
      getSetGlobalEditingStatus,
      getSetGlobalReplyStatus,
      parent,
      proposal,
      callback,
      isLast
    } = vnode.attrs;
    if (!comment) return;
    const parentType = comment.parentComment ? CommentParent.Comment : CommentParent.Proposal;

    const commentLink = `/${app.activeId()}/proposal/${proposal.slug}/`
      + `${proposal.identifier}-${slugify(proposal.title)}?comment=${comment.id}`;

    return m('.ProposalComment', {
      class: `${parentType}-child comment-${comment.id}`,
      onchange: () => m.redraw(), // TODO: avoid catching bubbled input events
    }, [
      (!isLast || app.user.activeAccount) && m('.thread-connector'),
      m('.comment-avatar', [
        m(ProposalBodyAvatar, { item: comment }),
      ]),
      m('.comment-body', [
        m('.comment-body-top', [
          m(ProposalBodyAuthor, { item: comment }),
          m(ProposalBodyCreated, { item: comment, link: commentLink }),
          m(ProposalBodyLastEdited, { item: comment }),

          // !vnode.state.editing
          //   && app.user.activeAccount
          //   && !getSetGlobalEditingStatus(GlobalStatus.Get)
          //   && app.user.activeAccount?.chain.id === comment.authorChain
          //   && app.user.activeAccount?.address === comment.author
          //   && [
          //     m(ProposalBodyEdit, {
          //       item: comment,
          //       getSetGlobalReplyStatus,
          //       getSetGlobalEditingStatus,
          //       parentState: vnode.state
          //     }),
          //     m(ProposalBodyDelete, { item: comment }),
          //   ],

          !vnode.state.editing
          && app.user.activeAccount
          && !getSetGlobalEditingStatus(GlobalStatus.Get)
          && app.user.activeAccount?.chain.id === comment.authorChain
          && app.user.activeAccount?.address === comment.author
          && [
            m(PopoverMenu, {
              closeOnContentClick: true,
              content: [
                m(ProposalBodyEditMenuItem, {
                  item: comment, getSetGlobalReplyStatus, getSetGlobalEditingStatus, parentState: vnode.state,
                }),
                m(ProposalBodyDeleteMenuItem, { item: comment, refresh: () => callback(), }),
                // parentType === CommentParent.Proposal // For now, we are limiting threading to 1 level deep
                // && m(ProposalBodyReplyMenuItem, {
                //   item: comment,
                //   getSetGlobalReplyStatus,
                //   parentType,
                //   parentState: vnode.state,
                // }),
              ],
              transitionDuration: 0,
              trigger: m(Icon, { name: Icons.CHEVRON_DOWN })
            })
          ],

          // For now, we are limiting threading to 1 level deep
          // Comments whose parents are other comments should not display the reply option
          // !vnode.state.editing
          //   && app.user.activeAccount
          //   && !getSetGlobalEditingStatus(GlobalStatus.Get)
          //   && parentType === CommentParent.Proposal
          //   && [
          //     m(ProposalBodyReply, {
          //       item: comment,
          //       getSetGlobalReplyStatus,
          //       parentType,
          //       parentState: vnode.state,
          //     }),
          //   ],
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
        m('.comment-body-bottom', [
          vnode.state.editing && m('.comment-body-bottom-left', [
            m(ProposalBodySaveEdit, { item: comment, getSetGlobalEditingStatus, parentState: vnode.state, callback }),
            m(ProposalBodyCancelEdit, { item: comment, getSetGlobalEditingStatus, parentState: vnode.state }),
          ]),
          m('.comment-body-bottom-right', [
            !vnode.state.editing && m(ProposalBodyReaction, { item: comment }),
          ]),
        ]),
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
    const {
      proposal, comments, createdCommentCallback, getSetGlobalEditingStatus,
      getSetGlobalReplyStatus, replyParent
    } = vnode.attrs;
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
            callback: createdCommentCallback,
            isLast: false, // TODO: implement isLast
          }),
          !!child.childComments.length
            && m('.child-comments-wrap', recursivelyGatherChildComments(child, replyParent2))
        ]);
      });
    };

    const AllComments = (comments2, replyParent2) => {
      return comments2.map((comment, index) => {
        return ([
          m(ProposalComment, {
            comment,
            getSetGlobalEditingStatus,
            getSetGlobalReplyStatus,
            parent: proposal,
            proposal,
            callback: createdCommentCallback,
            isLast: index === comments2.length - 1,
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
      class: app.user.activeAccount ? '' : 'no-active-account',
      oncreate: (vvnode) => { vnode.state.dom = vvnode.dom; },
    }, [
      // show comments
      comments
      && m('.proposal-comments', AllComments(comments, replyParent)),
      // create comment
      app.user.activeAccount
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
    ]);
  }
};

interface IPrefetch {
  [identifier: string]: {
    commentsStarted: boolean,
    viewCountStarted: boolean,
    profilesStarted: boolean,
    profilesFinished: boolean,
  }
}

async function loadCmd(type: string) {
  if (!app || !app.chain || !app.chain.loaded) {
    throw new Error('secondary loading cmd called before chain load');
  }
  if (app.chain.base !== ChainBase.Substrate) {
    return;
  }
  const c = proposalSlugToClass().get(type);
  if (c && c instanceof ProposalModule && !c.disabled) {
    await c.init(app.chain.chain, app.chain.accounts);
  }
}

const ViewProposalPage: m.Component<{
  identifier: string,
  type: string
}, {
  editing: boolean,
  recentlyEdited: boolean,
  replyParent: number | boolean,
  highlightedComment: boolean,
  prefetch: IPrefetch,
  comments,
  viewCount: number,
  proposal: AnyProposal | OffchainThread,
  threadFetched,
}> = {
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
    if (!vnode.state.prefetch || !vnode.state.prefetch[identifier]) {
      vnode.state.prefetch = {};
      vnode.state.prefetch[identifier] = {
        commentsStarted: false,
        viewCountStarted: false,
        profilesStarted: false,
        profilesFinished: false,
      };
    }
    const proposalId = identifier.split('-')[0];
    const proposalType = type;

    // load app controller
    if (!app.threads.initialized) {
      return m(PageLoading, { narrow: true, showNewProposalButton: true });
    }

    const proposalRecentlyEdited = vnode.state.recentlyEdited;
    const proposalDoesNotMatch = vnode.state.proposal && Number(vnode.state.proposal.identifier) !== Number(proposalId);
    // load proposal
    if (!vnode.state.proposal || proposalRecentlyEdited || proposalDoesNotMatch) {
      try {
        vnode.state.proposal = idToProposal(proposalType, proposalId);
      } catch (e) {
        // proposal might be loading, if it's not an offchain thread
        if (proposalType === ProposalType.OffchainThread) {
          if (!vnode.state.threadFetched) {
            app.threads.fetchThread(Number(proposalId)).then((res) => {
              vnode.state.proposal = res;
              m.redraw();
            }).catch((err) => {
              notifyError('Thread not found');
              return m(PageNotFound);
            });
            vnode.state.threadFetched = true;
          }
          return m(PageLoading, { narrow: true, showNewProposalButton: true });
        } else {
          if (!app.chain.loaded) return m(PageLoading, { narrow: true, showNewProposalButton: true });
          // check if module is still initializing
          const c = proposalSlugToClass().get(proposalType) as ProposalModule<any, any, any>;
          if (!c.disabled && !c.initialized) {
            if (!c.initializing) loadCmd(proposalType);
            return m(PageLoading, { narrow: true, showNewProposalButton: true });
          }
        }
        // proposal does not exist, 404
        return m(PageNotFound);
      }
    }
    const { proposal } = vnode.state;
    if (proposalRecentlyEdited) vnode.state.recentlyEdited = false;
    if (identifier !== `${proposalId}-${slugify(proposal.title)}`) {
      m.route.set(`/${app.activeId()}/proposal/${proposal.slug}/${proposalId}-${slugify(proposal.title)}`, {},
        { replace: true });
    }

    // load comments
    if (!vnode.state.prefetch[identifier]['commentsStarted']) {
      (app.activeCommunityId()
        ? app.comments.refresh(proposal, null, app.activeCommunityId())
        : app.comments.refresh(proposal, app.activeChainId(), null))
        .then((result) => {
          vnode.state.comments = app.comments.getByProposal(proposal).filter((c) => c.parentComment === null);
          m.redraw();
        }).catch((err) => {
          notifyError('Failed to load comments');
          vnode.state.comments = [];
          m.redraw();
        });
      vnode.state.prefetch[identifier]['commentsStarted'] = true;
    }

    if (vnode.state.comments?.length) {
      const mismatchedComments = vnode.state.comments.filter((c) => {
        return c.rootProposal !== `${vnode.attrs.type}_${vnode.attrs.identifier.split('-')[0]}`;
      });
      if (mismatchedComments.length) {
        vnode.state.prefetch[identifier]['commentsStarted'] = false;
      }
    }

    const createdCommentCallback = () => {
      vnode.state.comments = app.comments.getByProposal(proposal).filter((c) => c.parentComment === null);
      m.redraw();
    };

    // load view count
    if (!vnode.state.prefetch[identifier]['viewCountStarted'] && proposal instanceof OffchainThread) {
      $.post(`${app.serverUrl()}/viewCount`, {
        chain: app.activeChainId(),
        community: app.activeCommunityId(),
        object_id: proposal.id, // (proposal instanceof OffchainThread) ? proposal.id : proposal.slug,
      }).then((response) => {
        if (response.status !== 'Success') {
          vnode.state.viewCount = 0;
          throw new Error(`got unsuccessful status: ${response.status}`);
        } else {
          vnode.state.viewCount = response.result.view_count;
          m.redraw();
        }
      }).catch(() => {
        vnode.state.viewCount = 0;
        throw new Error('could not load view count');
      });
      vnode.state.prefetch[identifier]['viewCountStarted'] = true;
    } else if (!vnode.state.prefetch[identifier]['viewCountStarted']) {
      // view counts currently not supported for proposals
      vnode.state.prefetch[identifier]['viewCountStarted'] = true;
      vnode.state.viewCount = 0;
    }

    if (vnode.state.comments === undefined) {
      return m(PageLoading, { narrow: true, showNewProposalButton: true });
    }
    if (vnode.state.viewCount === undefined) {
      return m(PageLoading, { narrow: true, showNewProposalButton: true });
    }

    // load profiles
    // TODO: recursively fetch child comments as well (prevent reloading flash for threads with child comments)
    if (vnode.state.prefetch[identifier]['profilesStarted'] === undefined) {
      if (proposal instanceof OffchainThread) {
        app.profiles.getProfile(proposal.authorChain, proposal.author);
      } else if (proposal.author instanceof Account) { // AnyProposal
        app.profiles.getProfile(proposal.author.chain.id, proposal.author.address);
      }
      vnode.state.comments.forEach((comment) => {
        app.profiles.getProfile(comment.authorChain, comment.author);
      });
      vnode.state.prefetch[identifier]['profilesStarted'] = true;
    }
    if (!app.profiles.allLoaded() && !vnode.state.prefetch[identifier]['profilesFinished']) {
      return m(PageLoading, { narrow: true, showNewProposalButton: true });
    }
    vnode.state.prefetch[identifier]['profilesFinished'] = true;

    const windowListener = (e) => {
      if (vnode.state.editing || activeQuillEditorHasText()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', windowListener);

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
        if (status === false) {
          vnode.state.recentlyEdited = true;
        }
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
          const $reply = parentId
            ? $(`.comment-${parentId}`).nextAll('.CreateComment')
            : $('.ProposalComments > .CreateComment');

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
    return m(Sublayout, {
      class: 'ViewProposalPage',
      sidebarTopic: proposal instanceof OffchainThread ? proposal.topic?.id : null,
      rightSidebar: proposal instanceof OffchainThread
        ? null
        : m(ProposalSidebar, { proposal }),
      showNewProposalButton: true,
    }, [
      m(ProposalHeader, {
        proposal,
        commentCount,
        viewCount,
        getSetGlobalEditingStatus,
        getSetGlobalReplyStatus
      }),
      !(proposal instanceof OffchainThread) && m('.proposal-mobile-sidebar', [
        m(ProposalVotingActions, { proposal }),
      ]),
      !(proposal instanceof OffchainThread)
        && m(ProposalVotingResults, { proposal }),
      m(ProposalComments, {
        proposal,
        comments,
        createdCommentCallback,
        replyParent,
        getSetGlobalEditingStatus,
        getSetGlobalReplyStatus
      }),
    ]);
  }
};

export default ViewProposalPage;
