import $ from 'jquery';
import m from 'mithril';
import { PopoverMenu, Button, Input } from 'construct-ui';
import moment from 'moment';

import 'pages/view_proposal/index.scss';
import 'pages/view_proposal/tips.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import Sublayout from 'views/sublayout';
import { ProposalType, ChainBase } from 'common-common/src/types';
import {
  chainToProposalSlug,
  getProposalUrlPath,
  idToProposal,
  pathIsDiscussion,
  proposalSlugToClass,
} from 'identifiers';
import { slugify } from 'utils';
import Substrate from 'controllers/chain/substrate/main';
import { notifyError } from 'controllers/app/notifications';
import { CommentParent } from 'controllers/server/comments';
import {
  Thread,
  Comment,
  AnyProposal,
  Account,
  ProposalModule,
  DepositVote,
} from 'models';
import { VotingResults } from 'views/components/proposals/voting_results';
import { VotingActions } from 'views/components/proposals/voting_actions';
import { PageLoading } from 'views/pages/loading';
import { PageNotFound } from 'views/pages/404';
import { SubstrateTreasuryTip } from 'controllers/chain/substrate/treasury_tip';
import { SocialSharingCarat } from 'views/components/social_sharing_carat';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import { modelFromServer as modelReactionCountFromServer } from 'controllers/server/reactionCounts';
import Poll from 'models/Poll';
import {
  AaveViewProposalDetail,
  AaveViewProposalSummary,
} from './aave_view_proposal_detail';
import {
  activeQuillEditorHasText,
  GlobalStatus,
  ProposalBodyAvatar,
  ProposalBodyAuthor,
  ProposalBodyCreated,
  ProposalBodyLastEdited,
  ProposalBodyCancelEdit,
  ProposalBodySaveEdit,
  ProposalBodyText,
  ProposalBodyAttachments,
  ProposalBodyEditor,
  ProposalBodyEditMenuItem,
  ProposalBodyDeleteMenuItem,
} from './body';
import { CreateComment } from './create_comment';
import { LinkedProposalsEmbed } from './linked_proposals_embed';
import User from '../../components/widgets/user';
import { MarkdownFormattedText } from '../../components/quill/markdown_formatted_text';
import { createTXModal } from '../../modals/tx_signing_modal';
import { SubstrateAccount } from '../../../controllers/chain/substrate/account';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { InlineReplyButton } from '../../components/inline_reply_button';
import { PollEditorCard } from './poll_editor_card';
import { LinkedProposalsCard } from './linked_proposals_card';
import { LinkedThreadsCard } from './linked_threads_card';
import { CommentReactionButton } from '../../components/reaction_button/comment_reaction_button';
import { CWValidationText } from '../../components/component_kit/cw_validation_text';
import {
  getProposalPollTimestamp,
  handleProposalPollVote,
  jumpHighlightComment,
} from './helpers';
import { PollCard } from '../../components/poll_card';
import { OffchainVotingModal } from '../../modals/offchain_voting_modal';
import { QuillEditor } from '../../components/quill/quill_editor';
import { CWTabBar, CWTab } from '../../components/component_kit/cw_tabs';
import { isWindowMediumSmallInclusive } from '../../components/component_kit/helpers';
import { ProposalHeader } from './proposal_header';

const MAX_THREAD_LEVEL = 2;

interface IPrefetch {
  [identifier: string]: {
    commentsStarted: boolean;
    pollsStarted: boolean;
    viewCountStarted: boolean;
    profilesStarted: boolean;
    profilesFinished: boolean;
  };
}

export interface IProposalPageState {
  comments: Comment<Thread>[];
  polls: Poll[];
  editing: boolean;
  highlightedComment: boolean;
  parentCommentId: number; // if null or undefined, reply is thread-scoped
  prefetch: IPrefetch;
  proposal: AnyProposal | Thread;
  recentlyEdited: boolean;
  recentlySubmitted: number; // comment ID for CSS highlight transitions
  replying: boolean;
  stageEditorIsOpen: boolean;
  tabSelected: 'viewProposal' | 'viewSidebar';
  threadFetched;
  threadFetchFailed;
  tipAmount: number;
  viewCount: number;
}

export const scrollToForm = (parentId?: number) => {
  setTimeout(() => {
    const $reply = parentId
      ? $(`.comment-${parentId}`).nextAll('.CreateComment')
      : $('.ProposalComments > .CreateComment');

    // if the reply is at least partly offscreen, scroll it entirely into view
    const scrollTop = $('html, body').scrollTop();
    const replyTop = $reply.offset()?.top;
    if (scrollTop + $(window).height() < replyTop + $reply.outerHeight())
      $('html, body').animate(
        {
          scrollTop: replyTop + $reply.outerHeight() - $(window).height() + 40,
        },
        500
      );

    // highlight the reply form
    const animationDelayTime = 2000;
    $reply.addClass('highlighted');
    setTimeout(() => {
      $reply.removeClass('highlighted');
    }, animationDelayTime + 500);

    // focus the reply form
    $reply.find('.ql-editor').focus();
  }, 1);
};

const ProposalComment: m.Component<
  {
    comment: Comment<any>;
    getSetGlobalEditingStatus: CallableFunction;
    proposalPageState: IProposalPageState;
    parent: AnyProposal | Comment<any> | Thread;
    proposal: AnyProposal | Thread;
    callback?: Function;
    isAdmin?: boolean;
    isLast: boolean;
  },
  {
    editing: boolean;
    saving: boolean;
    replying: boolean;
    quillEditorState: QuillEditor;
  }
> = {
  view: (vnode) => {
    const {
      comment,
      getSetGlobalEditingStatus,
      proposalPageState,
      proposal,
      callback,
      isAdmin,
      isLast,
    } = vnode.attrs;

    if (!comment) return;
    const parentType = comment.parentComment
      ? CommentParent.Comment
      : CommentParent.Proposal;

    const commentLink = getProposalUrlPath(
      proposal.slug,
      `${proposal.identifier}-${slugify(proposal.title)}?comment=${comment.id}`
    );
    const commentReplyCount = app.comments
      .getByProposal(proposal)
      .filter((c) => c.parentComment === comment.id && !c.deleted).length;
    return m(
      '.ProposalComment',
      {
        class: `${parentType}-child comment-${comment.id}`,
        onchange: () => m.redraw(), // TODO: avoid catching bubbled input events
      },
      [
        (!isLast || app.user.activeAccount) && m('.thread-connector'),
        m('.comment-avatar', [m(ProposalBodyAvatar, { item: comment })]),
        m('.comment-body', [
          m('.comment-body-top', [
            m(ProposalBodyAuthor, { item: comment }),
            m(ProposalBodyCreated, { item: comment, link: commentLink }),
            m(ProposalBodyLastEdited, { item: comment }),

            ((!vnode.state.editing &&
              app.user.activeAccount &&
              !getSetGlobalEditingStatus(GlobalStatus.Get) &&
              app.user.activeAccount?.chain.id === comment.authorChain &&
              app.user.activeAccount?.address === comment.author) ||
              isAdmin) && [
              m(PopoverMenu, {
                closeOnContentClick: true,
                content: [
                  app.user.activeAccount?.address === comment.author &&
                    m(ProposalBodyEditMenuItem, {
                      item: comment,
                      proposalPageState,
                      getSetGlobalEditingStatus,
                      parentState: vnode.state,
                    }),
                  m(ProposalBodyDeleteMenuItem, {
                    item: comment,
                    refresh: () => callback(),
                  }),
                ],
                transitionDuration: 0,
                trigger: m('', [
                  m(CWIcon, {
                    iconName: 'chevronDown',
                    iconSize: 'small',
                  }),
                ]),
              }),
            ],
            m(SocialSharingCarat, { commentID: comment.id }),

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
            !vnode.state.editing && m(ProposalBodyText, { item: comment }),

            !vnode.state.editing &&
              comment.attachments &&
              comment.attachments.length > 0 &&
              m(ProposalBodyAttachments, { item: comment }),

            vnode.state.editing &&
              m(ProposalBodyEditor, {
                item: comment,
                parentState: vnode.state,
              }),
          ]),
          m('.comment-body-bottom', [
            vnode.state.editing &&
              m('.comment-edit-buttons', [
                m(ProposalBodySaveEdit, {
                  item: comment,
                  getSetGlobalEditingStatus,
                  parentState: vnode.state,
                  callback,
                }),
                m(ProposalBodyCancelEdit, {
                  item: comment,
                  getSetGlobalEditingStatus,
                  parentState: vnode.state,
                }),
              ]),
            !vnode.state.editing &&
              !comment.deleted &&
              m('.comment-response-row', [
                m(CommentReactionButton, {
                  comment,
                }),
                m(InlineReplyButton, {
                  commentReplyCount,
                  onclick: () => {
                    if (
                      !proposalPageState.replying ||
                      proposalPageState.parentCommentId !== comment.id
                    ) {
                      proposalPageState.replying = true;
                      proposalPageState.parentCommentId = comment.id;
                      scrollToForm(comment.id);
                    } else {
                      proposalPageState.replying = false;
                    }
                  },
                }),
              ]),
          ]),
        ]),
      ]
    );
  },
};

const ProposalComments: m.Component<
  {
    proposal: Thread | AnyProposal;
    comments: Array<Comment<any>>;
    createdCommentCallback: CallableFunction;
    getSetGlobalEditingStatus: CallableFunction;
    proposalPageState: IProposalPageState;
    user?: any;
    recentlySubmitted?: number;
    isAdmin: boolean;
  },
  {
    commentError: any;
    dom;
    highlightedComment: boolean;
  }
> = {
  view: (vnode) => {
    const {
      proposal,
      comments,
      createdCommentCallback,
      getSetGlobalEditingStatus,
      proposalPageState,
      isAdmin,
    } = vnode.attrs;
    // Jump to the comment indicated in the URL upon page load. Avoid
    // using m.route.param('comment') because it may return stale
    // results from a previous page if route transition hasn't finished
    if (
      vnode.state.dom &&
      comments?.length > 0 &&
      !vnode.state.highlightedComment
    ) {
      vnode.state.highlightedComment = true;
      const commentId = window.location.search.startsWith('?comment=')
        ? window.location.search.replace('?comment=', '')
        : null;
      if (commentId) jumpHighlightComment(commentId);
    }

    const nestedReplyForm = (comment) => {
      // if current comment is replyParent, & no posts are being edited, a nested comment form is rendered
      if (
        !proposalPageState.editing &&
        proposalPageState.parentCommentId === comment.id &&
        !getSetGlobalEditingStatus(GlobalStatus.Get)
      ) {
        return m(CreateComment, {
          callback: createdCommentCallback,
          cancellable: true,
          getSetGlobalEditingStatus,
          proposalPageState,
          parentComment: comment,
          rootProposal: proposal,
        });
      }
    };

    const isLivingCommentTree = (comment, children) => {
      if (!comment.deleted) return true;
      else if (!children.length) return false;
      else {
        let survivingDescendents = false;
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          if (!child.deleted) {
            survivingDescendents = true;
            break;
          }
          const grandchildren = app.comments
            .getByProposal(proposal)
            .filter((c) => c.parentComment === child.id);
          for (let j = 0; j < grandchildren.length; j++) {
            const grandchild = grandchildren[j];
            if (!grandchild.deleted) {
              survivingDescendents = true;
              break;
            }
          }
          if (survivingDescendents) break;
        }
        return survivingDescendents;
      }
    };

    const recursivelyGatherComments = (
      comments_: Comment<any>[],
      parent: AnyProposal | Thread | Comment<any>,
      threadLevel: number
    ) => {
      const canContinueThreading = threadLevel <= MAX_THREAD_LEVEL;
      return comments_.map((comment: Comment<any>, idx) => {
        if (!comment) return;
        const children = app.comments
          .getByProposal(proposal)
          .filter((c) => c.parentComment === comment.id);
        if (isLivingCommentTree(comment, children)) {
          return m(
            `.threading-level-${threadLevel}`,
            {
              style: `margin-left: 32px`,
            },
            [
              m(ProposalComment, {
                comment,
                getSetGlobalEditingStatus,
                proposalPageState,
                parent,
                proposal,
                callback: createdCommentCallback,
                isAdmin,
                isLast: idx === comments_.length - 1,
              }),
              !!children.length &&
                canContinueThreading &&
                recursivelyGatherComments(children, comment, threadLevel + 1),
              canContinueThreading && nestedReplyForm(comment),
            ]
          );
        }
      });
    };

    return m(
      '.ProposalComments',
      {
        oncreate: (vvnode) => {
          vnode.state.dom = vvnode.dom;
        },
      },
      [
        // show comments
        comments &&
          m(
            '.proposal-comments',
            recursivelyGatherComments(comments, proposal, 0)
          ),
        // create comment
        // errors
        vnode.state.commentError &&
          m(CWValidationText, {
            message: vnode.state.commentError,
            status: 'failure',
          }),
      ]
    );
  },
};

const ViewProposalPage: m.Component<
  {
    identifier: string;
    type?: string;
  },
  IProposalPageState
> = {
  oninit: (vnode) => {
    vnode.state.tabSelected = 'viewProposal';
  },
  oncreate: (vnode) => {
    // writes type field if accessed as /proposal/XXX (shortcut for non-substrate chains)

    if (!vnode.state.editing) {
      vnode.state.editing = false;
    }
  },
  view: (vnode) => {
    const { identifier } = vnode.attrs;
    const isDiscussion = pathIsDiscussion(app.activeChainId(), m.route.get());
    if (!app.chain?.meta && !isDiscussion) {
      return m(PageLoading, {
        narrow: true,
        showNewProposalButton: true,
        title: 'Loading...',
      });
    }
    const type =
      vnode.attrs.type ||
      (isDiscussion
        ? ProposalType.Thread
        : chainToProposalSlug(app.chain.meta));
    const headerTitle = isDiscussion ? 'Discussions' : 'Proposals';
    if (typeof identifier !== 'string')
      return m(PageNotFound, { title: headerTitle });
    const proposalId = identifier.split('-')[0];
    const proposalType = type;
    const proposalIdAndType = `${proposalId}-${proposalType}`;

    // we will want to prefetch comments, profiles, and viewCount on the page before rendering anything
    if (!vnode.state.prefetch || !vnode.state.prefetch[proposalIdAndType]) {
      vnode.state.prefetch = {};
      vnode.state.prefetch[proposalIdAndType] = {
        commentsStarted: false,
        pollsStarted: false,
        viewCountStarted: false,
        profilesStarted: false,
        profilesFinished: false,
      };
    }

    if (vnode.state.threadFetchFailed) {
      return m(PageNotFound, { title: headerTitle });
    }

    // load app controller
    if (!app.threads.initialized) {
      return m(PageLoading, {
        narrow: true,
        showNewProposalButton: true,
        title: headerTitle,
      });
    }

    const proposalRecentlyEdited = vnode.state.recentlyEdited;
    const proposalDoesNotMatch =
      vnode.state.proposal &&
      (+vnode.state.proposal.identifier !== +proposalId ||
        vnode.state.proposal.slug !== proposalType);
    if (proposalDoesNotMatch) {
      vnode.state.proposal = undefined;
      vnode.state.recentlyEdited = false;
      vnode.state.threadFetched = false;
    }
    // load proposal, and return m(PageLoading)
    if (!vnode.state.proposal || proposalRecentlyEdited) {
      try {
        vnode.state.proposal = idToProposal(proposalType, proposalId);
      } catch (e) {
        // proposal might be loading, if it's not an thread
        if (proposalType === ProposalType.Thread) {
          if (!vnode.state.threadFetched) {
            app.threads
              .fetchThreadsFromId([+proposalId])
              .then((res) => {
                vnode.state.proposal = res[0];
                m.redraw();
              })
              .catch((err) => {
                notifyError('Thread not found');
                vnode.state.threadFetchFailed = true;
              });
            vnode.state.threadFetched = true;
          }
          return m(PageLoading, {
            narrow: true,
            showNewProposalButton: true,
            title: headerTitle,
          });
        } else {
          if (!app.chain.loaded) {
            return m(PageLoading, {
              narrow: true,
              showNewProposalButton: true,
              title: headerTitle,
            });
          }
          // check if module is still initializing
          const c = proposalSlugToClass().get(proposalType) as ProposalModule<
            any,
            any,
            any
          >;
          if (!c) {
            return m(PageNotFound, { message: 'Invalid proposal type' });
          }
          if (!c.ready) {
            // TODO: perhaps we should be able to load here without fetching ALL proposal data
            // load sibling modules too
            if (app.chain.base === ChainBase.Substrate) {
              const chain = app.chain as Substrate;
              app.chain.loadModules([
                chain.council,
                chain.technicalCommittee,
                chain.treasury,
                chain.democracyProposals,
                chain.democracy,
                chain.tips,
              ]);
            } else {
              app.chain.loadModules([c]);
            }
            return m(PageLoading, {
              narrow: true,
              showNewProposalButton: true,
              title: headerTitle,
            });
          }
        }
        // proposal does not exist, 404
        return m(PageNotFound, { message: 'Proposal not found' });
      }
    }
    const { proposal } = vnode.state;
    if (proposalRecentlyEdited) vnode.state.recentlyEdited = false;
    if (identifier !== `${proposalId}-${slugify(proposal.title)}`) {
      navigateToSubpage(
        getProposalUrlPath(
          proposal.slug,
          `${proposalId}-${slugify(proposal.title)}`,
          true
        ),
        {},
        { replace: true }
      );
    }

    // load proposal
    if (!vnode.state.prefetch[proposalIdAndType]['threadReactionsStarted']) {
      app.threads.fetchReactionsCount([proposal]).then(() => m.redraw);
      vnode.state.prefetch[proposalIdAndType]['threadReactionsStarted'] = true;
    }

    // load comments
    if (!vnode.state.prefetch[proposalIdAndType]['commentsStarted']) {
      app.comments
        .refresh(proposal, app.activeChainId())
        .then(async () => {
          vnode.state.comments = app.comments
            .getByProposal(proposal)
            .filter((c) => c.parentComment === null);
          // fetch reactions
          const { result: reactionCounts } = await $.ajax({
            type: 'POST',
            url: `${app.serverUrl()}/reactionsCounts`,
            headers: {
              'content-type': 'application/json',
            },
            data: JSON.stringify({
              proposal_ids: [proposalId],
              comment_ids: app.comments
                .getByProposal(proposal)
                .map((comment) => comment.id),
              active_address: app.user.activeAccount?.address,
            }),
          });
          // app.reactionCounts.deinit()
          for (const rc of reactionCounts) {
            const id = app.reactionCounts.store.getIdentifier({
              threadId: rc.thread_id,
              proposalId: rc.proposal_id,
              commentId: rc.comment_id,
            });
            app.reactionCounts.store.add(
              modelReactionCountFromServer({ ...rc, id })
            );
          }
          m.redraw();
        })
        .catch(() => {
          notifyError('Failed to load comments');
          vnode.state.comments = [];
          m.redraw();
        });
      vnode.state.prefetch[proposalIdAndType]['commentsStarted'] = true;
    }

    if (vnode.state.comments?.length) {
      const mismatchedComments = vnode.state.comments.filter((c) => {
        return c.rootProposal !== `${type}_${proposalId}`;
      });
      if (mismatchedComments.length) {
        vnode.state.prefetch[proposalIdAndType]['commentsStarted'] = false;
      }
    }

    const createdCommentCallback = () => {
      vnode.state.comments = app.comments
        .getByProposal(proposal)
        .filter((c) => c.parentComment === null);
      m.redraw();
    };

    // load polls
    if (
      proposal instanceof Thread &&
      !vnode.state.prefetch[proposalIdAndType]['pollsStarted']
    ) {
      app.polls.fetchPolls(app.activeChainId(), proposal.id).catch(() => {
        notifyError('Failed to load comments');
        vnode.state.comments = [];
        m.redraw();
      });
      vnode.state.prefetch[proposalIdAndType]['pollsStarted'] = true;
    } else if (proposal instanceof Thread) {
      vnode.state.polls = app.polls.getByThreadId(proposal.id);
    }

    // load view count
    if (
      !vnode.state.prefetch[proposalIdAndType]['viewCountStarted'] &&
      proposal instanceof Thread
    ) {
      $.post(`${app.serverUrl()}/viewCount`, {
        chain: app.activeChainId(),
        object_id: proposal.id, // (proposal instanceof Thread) ? proposal.id : proposal.slug,
      })
        .then((response) => {
          if (response.status !== 'Success') {
            vnode.state.viewCount = 0;
            throw new Error(`got unsuccessful status: ${response.status}`);
          } else {
            vnode.state.viewCount = response.result.view_count;
            m.redraw();
          }
        })
        .catch(() => {
          vnode.state.viewCount = 0;
          throw new Error('could not load view count');
        });
      vnode.state.prefetch[proposalIdAndType]['viewCountStarted'] = true;
    } else if (!vnode.state.prefetch[proposalIdAndType]['viewCountStarted']) {
      // view counts currently not supported for proposals
      vnode.state.prefetch[proposalIdAndType]['viewCountStarted'] = true;
      vnode.state.viewCount = 0;
    }

    if (vnode.state.comments === undefined) {
      return m(PageLoading, {
        narrow: true,
        showNewProposalButton: true,
        title: headerTitle,
      });
    }
    if (vnode.state.viewCount === undefined) {
      return m(PageLoading, {
        narrow: true,
        showNewProposalButton: true,
        title: headerTitle,
      });
    }

    // load profiles
    if (
      vnode.state.prefetch[proposalIdAndType]['profilesStarted'] === undefined
    ) {
      if (proposal instanceof Thread) {
        app.profiles.getProfile(proposal.authorChain, proposal.author);
      } else if (proposal.author instanceof Account) {
        // AnyProposal
        app.profiles.getProfile(
          proposal.author.chain.id,
          proposal.author.address
        );
      }
      vnode.state.comments.forEach((comment) => {
        app.profiles.getProfile(comment.authorChain, comment.author);
      });
      vnode.state.prefetch[proposalIdAndType]['profilesStarted'] = true;
    }
    if (
      !app.profiles.allLoaded() &&
      !vnode.state.prefetch[proposalIdAndType]['profilesFinished']
    ) {
      return m(PageLoading, {
        narrow: true,
        showNewProposalButton: true,
        title: headerTitle,
      });
    }
    vnode.state.prefetch[proposalIdAndType]['profilesFinished'] = true;

    const windowListener = (e) => {
      if (vnode.state.editing || activeQuillEditorHasText()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', windowListener);

    const comments = vnode.state.comments;
    const viewCount: number = vnode.state.viewCount;
    const commentCount: number = app.comments.nComments(proposal);
    const voterCount: number =
      proposal instanceof Thread ? 0 : proposal.getVotes().length;

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

    // Original posters have full editorial control, while added collaborators
    // merely have access to the body and title
    const { activeAccount } = app.user;

    const authorChain =
      proposal instanceof Thread ? proposal.authorChain : app.activeChainId();
    const authorAddress =
      proposal instanceof Thread ? proposal.author : proposal.author?.address;
    const isAuthor =
      activeAccount?.address === authorAddress &&
      activeAccount?.chain.id === authorChain;
    const isEditor =
      (proposal as Thread).collaborators?.filter((c) => {
        return (
          c.address === activeAccount?.address &&
          c.chain === activeAccount?.chain.id
        );
      }).length > 0;
    const isAdminOrMod =
      app.user.isRoleOfCommunity({
        role: 'admin',
        chain: app.activeChainId(),
      }) ||
      app.user.isRoleOfCommunity({
        role: 'moderator',
        chain: app.activeChainId(),
      });
    const isAdmin = app.user.isRoleOfCommunity({
      role: 'admin',
      chain: app.activeChainId(),
    });

    if (proposal instanceof SubstrateTreasuryTip) {
      const {
        author,
        title,
        data: { who, reason },
      } = proposal;
      const contributors = proposal.getVotes();
      return m(
        Sublayout,
        {
          showNewProposalButton: true,
          title: headerTitle,
        },
        [
          m('.TipDetailPage', [
            m('.tip-details', [
              m('.title', title),
              m('.proposal-page-row', [
                m('.label', 'Finder'),
                m(User, {
                  user: author,
                  linkify: true,
                  popover: true,
                  showAddressWithDisplayName: true,
                }),
              ]),
              m('.proposal-page-row', [
                m('.label', 'Beneficiary'),
                m(User, {
                  user: app.profiles.getProfile(proposal.author.chain.id, who),
                  linkify: true,
                  popover: true,
                  showAddressWithDisplayName: true,
                }),
              ]),
              m('.proposal-page-row', [
                m('.label', 'Reason'),
                m('.tip-reason', [m(MarkdownFormattedText, { doc: reason })]),
              ]),
              m('.proposal-page-row', [
                m('.label', 'Amount'),
                m('.amount', [
                  m('.denominator', proposal.support.denom),
                  m('', proposal.support.inDollars),
                ]),
              ]),
            ]),
            m('.tip-contributions', [
              proposal.canVoteFrom(
                app.user.activeAccount as SubstrateAccount
              ) &&
                m('.contribute', [
                  m('.title', 'Contribute'),
                  m('.mb-12', [
                    m('.label', 'Amount'),
                    m(Input, {
                      name: 'amount',
                      placeholder: 'Enter tip amount',
                      autocomplete: 'off',
                      fluid: true,
                      oninput: (e) => {
                        const result = (e.target as any).value;
                        vnode.state.tipAmount =
                          result.length > 0
                            ? app.chain.chain.coins(parseFloat(result), true)
                            : undefined;
                        m.redraw();
                      },
                    }),
                  ]),
                  m(Button, {
                    disabled: vnode.state.tipAmount === undefined,
                    intent: 'primary',
                    rounded: true,
                    label: 'Submit Transaction',
                    onclick: (e) => {
                      e.preventDefault();
                      createTXModal(
                        proposal.submitVoteTx(
                          new DepositVote(
                            app.user.activeAccount,
                            vnode.state.tipAmount
                          )
                        )
                      );
                    },
                    tabindex: 4,
                    type: 'submit',
                  }),
                ]),
              contributors.length > 0 && [
                m('.contributors .title', 'Contributors'),
                contributors.map(({ account, deposit }) =>
                  m('.contributors-row', [
                    m('.amount', [
                      m('.denominator', deposit.denom),
                      m('', deposit.inDollars),
                    ]),
                    m(User, {
                      user: account,
                      linkify: true,
                      popover: true,
                      showAddressWithDisplayName: true,
                    }),
                  ])
                ),
              ],
            ]),
          ]),
        ]
      );
    }

    const showLinkedSnapshotOptions =
      (proposal as Thread).snapshotProposal?.length > 0 ||
      (proposal as Thread).chainEntities?.length > 0 ||
      isAuthor ||
      isAdminOrMod;

    const showLinkedThreadOptions =
      (proposal as Thread).linkedThreads?.length > 0 ||
      isAuthor ||
      isAdminOrMod;

    window.onresize = () => {
      if (
        isWindowMediumSmallInclusive(window.innerWidth) &&
        vnode.state.tabSelected !== 'viewProposal'
      ) {
        vnode.state.tabSelected = 'viewProposal';
        m.redraw();
      }
    };

    const sidebarCheck =
      showLinkedSnapshotOptions ||
      showLinkedThreadOptions ||
      (proposal instanceof Thread && vnode.state.polls?.length > 0) ||
      (proposal instanceof Thread && isAuthor);

    return m(
      Sublayout,
      {
        showNewProposalButton: true,
        title: headerTitle,
      },
      m('.ViewProposalPage', [
        sidebarCheck &&
          m('.view-proposal-body-with-tabs', [
            m(CWTabBar, [
              m(CWTab, {
                label: 'Proposal',
                onclick: () => {
                  vnode.state.tabSelected = 'viewProposal';
                },
                isSelected: vnode.state.tabSelected === 'viewProposal',
              }),
              m(CWTab, {
                label: 'Info & Results',
                onclick: () => {
                  vnode.state.tabSelected = 'viewSidebar';
                },
                isSelected: vnode.state.tabSelected === 'viewSidebar',
              }),
            ]),
            vnode.state.tabSelected === 'viewProposal' && [
              m('.view-proposal-content-container', [
                m(ProposalHeader, {
                  proposal,
                  commentCount,
                  viewCount,
                  getSetGlobalEditingStatus,
                  proposalPageState: vnode.state,
                  isAuthor,
                  isEditor,
                  isAdmin: isAdminOrMod,
                  stageEditorIsOpen: vnode.state.stageEditorIsOpen,
                  closeStageEditor: () => {
                    vnode.state.stageEditorIsOpen = false;
                    m.redraw();
                  },
                }),
                !(proposal instanceof Thread) &&
                  m(LinkedProposalsEmbed, { proposal }),
                proposal instanceof AaveProposal && [
                  m(AaveViewProposalSummary, { proposal }),
                  m(AaveViewProposalDetail, { proposal }),
                ],
                !(proposal instanceof Thread) && m(VotingResults, { proposal }),
                !(proposal instanceof Thread) && m(VotingActions, { proposal }),
                m(ProposalComments, {
                  proposal,
                  comments,
                  createdCommentCallback,
                  getSetGlobalEditingStatus,
                  proposalPageState: vnode.state,
                  recentlySubmitted: vnode.state.recentlySubmitted,
                  isAdmin: isAdminOrMod,
                }),
                !vnode.state.editing &&
                  !vnode.state.parentCommentId &&
                  m(CreateComment, {
                    callback: createdCommentCallback,
                    cancellable: true,
                    getSetGlobalEditingStatus,
                    proposalPageState: vnode.state,
                    parentComment: null,
                    rootProposal: proposal,
                  }),
              ]),
            ],
            vnode.state.tabSelected === 'viewSidebar' &&
              m('.view-sidebar-content-container', [
                showLinkedSnapshotOptions &&
                  proposal instanceof Thread &&
                  m(LinkedProposalsCard, {
                    proposal,
                    openStageEditor: () => {
                      vnode.state.stageEditorIsOpen = true;
                    },
                    showAddProposalButton: isAuthor || isAdminOrMod,
                  }),
                showLinkedThreadOptions &&
                  proposal instanceof Thread &&
                  m(LinkedThreadsCard, {
                    proposalId: proposal.id,
                    allowLinking: isAuthor || isAdminOrMod,
                  }),
                proposal instanceof Thread &&
                  [
                    ...new Map(
                      vnode.state.polls?.map((poll) => [poll.id, poll])
                    ).values(),
                  ].map((poll) => {
                    return m(PollCard, {
                      multiSelect: false,
                      pollEnded:
                        poll.endsAt && poll.endsAt?.isBefore(moment().utc()),
                      hasVoted:
                        app.user.activeAccount &&
                        poll.getUserVote(
                          app.user.activeAccount?.chain?.id,
                          app.user.activeAccount?.address
                        ),
                      disableVoteButton: !app.user.activeAccount,
                      votedFor: poll.getUserVote(
                        app.user.activeAccount?.chain?.id,
                        app.user.activeAccount?.address
                      )?.option,
                      proposalTitle: poll.prompt,
                      timeRemaining: getProposalPollTimestamp(
                        poll,
                        poll.endsAt && poll.endsAt?.isBefore(moment().utc())
                      ),
                      totalVoteCount: poll.votes?.length,
                      voteInformation: poll.options.map((option) => {
                        return {
                          label: option,
                          value: option,
                          voteCount: poll.votes.filter(
                            (v) => v.option === option
                          ).length,
                        };
                      }),
                      incrementalVoteCast: 1,
                      tooltipErrorMessage: app.user.activeAccount
                        ? null
                        : 'You must join this community to vote.',
                      onVoteCast: (option, isSelected, callback) =>
                        handleProposalPollVote(
                          poll,
                          option,
                          isSelected,
                          callback
                        ),
                      onResultsClick: (e) => {
                        e.preventDefault();
                        if (poll.votes.length > 0) {
                          app.modals.create({
                            modal: OffchainVotingModal,
                            data: { votes: poll.votes },
                          });
                        }
                      },
                    });
                  }),
                proposal instanceof Thread &&
                  isAuthor &&
                  (!app.chain?.meta?.adminOnlyPolling || isAdmin) &&
                  m(PollEditorCard, {
                    proposal,
                    proposalAlreadyHasPolling: !vnode.state.polls?.length,
                  }),
              ]),
          ]),
        m(`.view-proposal-body ${sidebarCheck && '.hasSidebar'}`, [
          m('.view-proposal-content-container', [
            m(ProposalHeader, {
              proposal,
              commentCount,
              viewCount,
              getSetGlobalEditingStatus,
              proposalPageState: vnode.state,
              isAuthor,
              isEditor,
              isAdmin: isAdminOrMod,
              stageEditorIsOpen: vnode.state.stageEditorIsOpen,
              closeStageEditor: () => {
                vnode.state.stageEditorIsOpen = false;
                m.redraw();
              },
            }),
            !(proposal instanceof Thread) &&
              m(LinkedProposalsEmbed, { proposal }),
            proposal instanceof AaveProposal && [
              m(AaveViewProposalSummary, { proposal }),
              m(AaveViewProposalDetail, { proposal }),
            ],
            !(proposal instanceof Thread) && m(VotingResults, { proposal }),
            !(proposal instanceof Thread) && m(VotingActions, { proposal }),
            m(ProposalComments, {
              proposal,
              comments,
              createdCommentCallback,
              getSetGlobalEditingStatus,
              proposalPageState: vnode.state,
              recentlySubmitted: vnode.state.recentlySubmitted,
              isAdmin: isAdminOrMod,
            }),
            !vnode.state.editing &&
              !vnode.state.parentCommentId &&
              m(CreateComment, {
                callback: createdCommentCallback,
                cancellable: true,
                getSetGlobalEditingStatus,
                proposalPageState: vnode.state,
                parentComment: null,
                rootProposal: proposal,
              }),
          ]),
          m('.view-sidebar-content-container', [
            showLinkedSnapshotOptions &&
              proposal instanceof Thread &&
              m(LinkedProposalsCard, {
                proposal,
                openStageEditor: () => {
                  vnode.state.stageEditorIsOpen = true;
                },
                showAddProposalButton: isAuthor || isAdminOrMod,
              }),
            showLinkedThreadOptions &&
              proposal instanceof Thread &&
              m(LinkedThreadsCard, {
                proposalId: proposal.id,
                allowLinking: isAuthor || isAdminOrMod,
              }),
            proposal instanceof Thread &&
              [
                ...new Map(
                  vnode.state.polls?.map((poll) => [poll.id, poll])
                ).values(),
              ].map((poll) => {
                return m(PollCard, {
                  multiSelect: false,
                  pollEnded:
                    poll.endsAt && poll.endsAt?.isBefore(moment().utc()),
                  hasVoted:
                    app.user.activeAccount &&
                    poll.getUserVote(
                      app.user.activeAccount?.chain?.id,
                      app.user.activeAccount?.address
                    ),
                  disableVoteButton: !app.user.activeAccount,
                  votedFor: poll.getUserVote(
                    app.user.activeAccount?.chain?.id,
                    app.user.activeAccount?.address
                  )?.option,
                  proposalTitle: poll.prompt,
                  timeRemaining: getProposalPollTimestamp(
                    poll,
                    poll.endsAt && poll.endsAt?.isBefore(moment().utc())
                  ),
                  totalVoteCount: poll.votes?.length,
                  voteInformation: poll.options.map((option) => {
                    return {
                      label: option,
                      value: option,
                      voteCount: poll.votes.filter((v) => v.option === option)
                        .length,
                    };
                  }),
                  incrementalVoteCast: 1,
                  tooltipErrorMessage: app.user.activeAccount
                    ? null
                    : 'You must join this community to vote.',
                  onVoteCast: (option, isSelected, callback) =>
                    handleProposalPollVote(poll, option, isSelected, callback),
                  onResultsClick: (e) => {
                    e.preventDefault();
                    if (poll.votes.length > 0) {
                      app.modals.create({
                        modal: OffchainVotingModal,
                        data: { votes: poll.votes },
                      });
                    }
                  },
                });
              }),
            proposal instanceof Thread &&
              isAuthor &&
              (!app.chain?.meta?.adminOnlyPolling || isAdmin) &&
              m(PollEditorCard, {
                proposal,
                proposalAlreadyHasPolling: !vnode.state.polls?.length,
              }),
          ]),
        ]),
      ])
    );
  },
};

export default ViewProposalPage;
