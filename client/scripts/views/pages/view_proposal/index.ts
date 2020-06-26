import 'pages/view_proposal/index.scss';

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { PopoverMenu, Icon, Icons } from 'construct-ui';

import { NotificationCategories } from 'types';
import app from 'state';
import Sublayout from 'views/sublayout';
import { idToProposal, ProposalType } from 'identifiers';
import { slugify, isSameAccount } from 'helpers';

import { notifyError } from 'controllers/app/notifications';
import { CommentParent } from 'controllers/server/comments';
import {
  OffchainThread,
  OffchainThreadKind,
  OffchainComment,
  OffchainTag,
  AnyProposal,
  Account,
} from 'models';

import jumpHighlightComment from 'views/pages/view_proposal/jump_to_comment';
import TagEditor from 'views/components/tag_editor';
import { TagEditorButton, ThreadSubscriptionButton } from 'views/pages/discussions/thread_carat_menu';
import ProposalVotingActions from 'views/components/proposals/voting_actions';
import ProposalVotingResults from 'views/components/proposals/voting_results';
import User from 'views/components/widgets/user';
import PageLoading from 'views/pages/loading';
import PageNotFound from 'views/pages/404';

import {
  ProposalHeaderAuthor, ProposalHeaderCreated, ProposalHeaderDelete,
  ProposalHeaderExternalLink, ProposalHeaderLastEdited, ProposalHeaderTags, ProposalHeaderTitle,
  ProposalHeaderOnchainId, ProposalHeaderOnchainStatus, ProposalHeaderSpacer, ProposalHeaderViewCount,
  ProposalHeaderPrivacyButtons
} from './header';
import {
  activeQuillEditorHasText, GlobalStatus, ProposalBodyAvatar, ProposalBodyAuthor, ProposalBodyCreated,
  ProposalBodyLastEdited, ProposalBodyReply, ProposalBodyEdit, ProposalBodyDelete, ProposalBodyCancelEdit,
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
  editing: boolean;
  quillEditorState: any;
  currentText: any;
  tagEditorIsOpen: boolean;
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
    const proposalLink = `/${app.activeId()}/proposal/${proposal.slug}/${proposal.identifier}-`
      + `${slugify(proposal.title)}`;
    const author : Account<any> = proposal instanceof OffchainThread
      ? (!app.community
        ? app.chain.accounts.get(proposal.author)
        : app.community.accounts.get(proposal.author, proposal.authorChain))
      : proposal.author;

    const notificationSubscription = app.user.notifications.subscriptions
      .find((v) => v.category === NotificationCategories.NewComment && v.objectId === proposal.uniqueIdentifier);

    const canEdit = (proposal instanceof OffchainThread
                     && app.user.activeAccount?.address === proposal.author
                     && app.user.activeAccount?.chain.id === proposal.authorChain)
      || app.user.isRoleOfCommunity({
        role: 'admin',
        chain: app.activeChainId(),
        community: app.activeCommunityId()
      }) || app.user.isRoleOfCommunity({
        role: 'moderator',
        chain: app.activeChainId(),
        community: app.activeCommunityId()
      });

    return m('.ProposalHeader', {
      class: `proposal-${proposal.slug}`
    }, [
      m('.proposal-top', [
        m('.proposal-top-left', [
          m('.proposal-title', m(ProposalHeaderTitle, { proposal })),
          m('.proposal-body-meta', proposal instanceof OffchainThread ? [
            m(ProposalHeaderAuthor, { proposal }),
            m(ProposalHeaderCreated, { proposal, link: proposalLink }),
            m(ProposalHeaderLastEdited, { proposal }),
            m(ProposalHeaderTags, { proposal }),
          ] : [
            m(ProposalHeaderOnchainId, { proposal }),
            m(ProposalHeaderOnchainStatus, { proposal }),
            m(ProposalHeaderAuthor, { proposal }),
            m(ProposalHeaderCreated, { proposal, link: proposalLink }),
          ]),
          proposal instanceof OffchainThread
            && proposal.kind === OffchainThreadKind.Link
            && m('.proposal-body-link', m(ProposalHeaderExternalLink, { proposal })),
        ]),
        m('.proposal-top-right', [
          app.isLoggedIn() && m(PopoverMenu, {
            transitionDuration: 0,
            closeOnOutsideClick: true,
            closeOnContentClick: true,
            menuAttrs: { size: 'default' },
            content: [
              canEdit && proposal instanceof OffchainThread && m(TagEditorButton, {
                openTagEditor: () => {
                  vnode.state.tagEditorIsOpen = true;
                }
              }),
              m(ThreadSubscriptionButton, { proposal: proposal as OffchainThread }),
              canEdit && m(ProposalHeaderDelete, { proposal }),
              canEdit && m(ProposalHeaderPrivacyButtons, { proposal }),
              proposal instanceof OffchainThread
                && !getSetGlobalEditingStatus(GlobalStatus.Get)
                && isSameAccount(app.user.activeAccount, author)
                && !vnode.state.editing
                && [
                  m(ProposalBodyEditMenuItem, {
                    item: proposal, getSetGlobalReplyStatus, getSetGlobalEditingStatus, parentState: vnode.state,
                  }),
                  m(ProposalBodyDeleteMenuItem, { item: proposal }),
                ],
              proposal instanceof OffchainThread
                && vnode.state.editing
                && [
                  m(ProposalBodyCancelEdit, { getSetGlobalEditingStatus, parentState: vnode.state }),
                  m(ProposalBodySaveEdit, { item: proposal, getSetGlobalEditingStatus, parentState: vnode.state })
                ],
            ],
            trigger: m(Icon, { name: Icons.CHEVRON_DOWN }),
          }),
          vnode.state.tagEditorIsOpen && proposal instanceof OffchainThread && m(TagEditor, {
            thread: vnode.attrs.proposal as OffchainThread,
            popoverMenu: true,
            onChangeHandler: (tag: OffchainTag) => { proposal.tag = tag; m.redraw(); },
          })
        ]),
      ]),
      proposal instanceof OffchainThread && m('.proposal-content', [
        !vnode.state.editing
          && m(ProposalBodyText, { item: proposal }),

        !vnode.state.editing
          && attachments
          && attachments.length > 0
          && m(ProposalBodyAttachments, { item: proposal }),

        vnode.state.editing
          && m(ProposalBodyEditor, { item: proposal, parentState: vnode.state }),
      ]),
      proposal instanceof OffchainThread && m('.proposal-bottom', [
        m('.proposal-body-reactions', [
          m(ProposalBodyReaction, { item: proposal }),
        ]),
        m('.proposal-body-viewcount', [
          m(ProposalHeaderViewCount, { viewCount }),
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
  callback?: Function;
}

const ProposalComment: m.Component<IProposalCommentAttrs, IProposalCommentState> = {
  view: (vnode) => {
    const { comment, getSetGlobalEditingStatus, getSetGlobalReplyStatus, parent, proposal, callback } = vnode.attrs;
    if (!comment) return;
    const parentType = comment.parentComment ? CommentParent.Comment : CommentParent.Proposal;

    const commentLink = `/${app.activeId()}/proposal/${proposal.slug}/`
      + `${proposal.identifier}-${slugify(proposal.title)}?comment=${comment.id}`;

    return m('.ProposalComment', {
      class: `${parentType}-child comment-${comment.id}`,
      onchange: () => m.redraw(),
    }, [
      m('.comment-avatar', [
        m(ProposalBodyAvatar, { comment }),
      ]),
      m('.comment-body', [
        m('.comment-body-meta', [
          m(ProposalBodyAuthor, { comment }),
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
                m(ProposalBodyDeleteMenuItem, { item: comment }),
                parentType === CommentParent.Proposal // For now, we are limiting threading to 1 level deep
                && m(ProposalBodyReplyMenuItem, {
                  item: comment,
                  getSetGlobalReplyStatus,
                  parentType,
                  parentState: vnode.state,
                }),
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

          vnode.state.editing && [
            m(ProposalBodyCancelEdit, { getSetGlobalEditingStatus, parentState: vnode.state }),
            m(ProposalBodySaveEdit, { item: comment, getSetGlobalEditingStatus, parentState: vnode.state, callback }),
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
        m('.comment-body-reactions', [
          m(ProposalBodyReaction, { item: comment }),
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
            callback: createdCommentCallback,
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
      oncreate: (vnode2) => { vnode.state.dom = vnode2.dom; },
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
      m(ProposalVotingResults, { proposal }),
    ]);
  }
};

const ViewProposalPage: m.Component<{ identifier: string, type: string }, {
  editing: boolean,
  replyParent: number | boolean,
  highlightedComment: boolean,
  commentsPrefetchStarted: boolean,
  comments,
  viewCountPrefetchStarted: boolean,
  viewCount: number,
  profilesPrefetchStarted: boolean
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
          notifyError('Failed to load comments');
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
          throw new Error(`got unsuccessful status: ${response.status}`);
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
    // TODO: recursively fetch child comments as well (prevent reloading flash for threads with child comments)
    if (vnode.state.profilesPrefetchStarted === undefined) {
      if (proposal instanceof OffchainThread) {
        app.profiles.getProfile(proposal.authorChain, proposal.author);
      } else if (proposal.author instanceof Account) { // AnyProposal
        app.profiles.getProfile(proposal.author.chain.id, proposal.author.address);
      }
      vnode.state.comments.forEach((comment) => {
        app.profiles.getProfile(comment.authorChain, comment.author);
      });
      vnode.state.profilesPrefetchStarted = true;
    }
    if (!app.profiles.allLoaded()) {
      return m(PageLoading);
    }

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
      rightSidebar: m(ProposalSidebar, { proposal }),
    }, [
      m(ProposalHeader, {
        proposal,
        commentCount,
        viewCount,
        getSetGlobalEditingStatus,
        getSetGlobalReplyStatus
      }),
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
