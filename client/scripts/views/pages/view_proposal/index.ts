import 'pages/view_proposal/index.scss';
import 'pages/view_proposal/tips.scss';

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { PopoverMenu, MenuDivider, MenuItem, Icon, Icons, Button, Input  } from 'construct-ui';

import app from 'state';
import Sublayout from 'views/sublayout';
import { idToProposal, ProposalType, proposalSlugToClass } from 'identifiers';
import { slugify } from 'utils';

import Substrate from 'controllers/chain/substrate/main';
import { notifyError } from 'controllers/app/notifications';
import { CommentParent } from 'controllers/server/comments';
import {
  OffchainThread,
  OffchainThreadKind,
  OffchainComment,
  OffchainTopic,
  OffchainThreadStage,
  AnyProposal,
  Account,
  ChainBase,
  ChainEntity,
  ProposalModule,
  DepositVote,
} from 'models';

import jumpHighlightComment from 'views/pages/view_proposal/jump_to_comment';
import TopicEditor from 'views/components/topic_editor';
import StageEditor from 'views/components/stage_editor';
import PollEditor from 'views/components/poll_editor';
import {
  TopicEditorMenuItem, ThreadSubscriptionMenuItem
} from 'views/pages/discussions/discussion_row_menu';
import ProposalVotingActions from 'views/components/proposals/voting_actions';
import ProposalVotingResults from 'views/components/proposals/voting_results';
import PageLoading from 'views/pages/loading';
import PageNotFound from 'views/pages/404';

import SubstrateDemocracyProposal from 'controllers/chain/substrate/democracy_proposal';
import { SubstrateCollectiveProposal } from 'controllers/chain/substrate/collective_proposal';
import { SubstrateTreasuryProposal } from 'controllers/chain/substrate/treasury_proposal';
import { SubstrateTreasuryTip } from 'controllers/chain/substrate/treasury_tip';

import { SocialSharingCarat } from 'views/components/social_sharing_carat';

import {
  ProposalHeaderExternalLink, ProposalHeaderBlockExplorerLink, ProposalHeaderVotingInterfaceLink,
  ProposalHeaderOffchainPoll,
  ProposalHeaderThreadLink, ProposalHeaderThreadLinkedChainEntity,
  ProposalHeaderTopics, ProposalHeaderTitle, ProposalHeaderStage,
  ProposalHeaderOnchainId, ProposalHeaderOnchainStatus, ProposalHeaderSpacer, ProposalHeaderViewCount,
  ProposalHeaderPrivacyMenuItems,
  ProposalTitleEditor,
  ProposalTitleEditMenuItem,
  ProposalSidebarStageEditorModule,
  ProposalSidebarPollEditorModule,
} from './header';
import {
  activeQuillEditorHasText, GlobalStatus, ProposalBodyAvatar, ProposalBodyAuthor, ProposalBodyCreated,
  ProposalBodyLastEdited, ProposalBodyCancelEdit, ProposalBodySaveEdit,
  ProposalBodySpacer, ProposalBodyText, ProposalBodyAttachments, ProposalBodyEditor,
  ProposalBodyReaction, ProposalBodyEditMenuItem, ProposalBodyDeleteMenuItem, EditPermissionsButton,
  ProposalEditorPermissions,
} from './body';
import CreateComment from './create_comment';
import LinkedProposalsEmbed from './linked_proposals_embed';
import User from '../../components/widgets/user';
import MarkdownFormattedText from '../../components/markdown_formatted_text';
import { createTXModal } from '../../modals/tx_signing_modal';
import { SubstrateAccount } from '../../../controllers/chain/substrate/account';


const ProposalHeader: m.Component<{
  commentCount: number;
  viewCount: number;
  getSetGlobalEditingStatus: CallableFunction;
  getSetGlobalReplyStatus: CallableFunction;
  proposal: AnyProposal | OffchainThread;
  isAuthor: boolean;
  isEditor: boolean;
  isAdmin: boolean;
  stageEditorIsOpen: boolean;
  pollEditorIsOpen: boolean;
  closePollEditor: Function;
  closeStageEditor: Function;
}, {
  savedEdit: string;
  editing: boolean;
  saving: boolean;
  quillEditorState: any;
  currentText: any;
  topicEditorIsOpen: boolean;
  editPermissionsIsOpen: boolean;
}> = {
  view: (vnode) => {
    const {
      commentCount,
      proposal,
      getSetGlobalEditingStatus,
      getSetGlobalReplyStatus,
      viewCount,
      isAuthor,
      isEditor,
      isAdmin,
    } = vnode.attrs;

    const attachments = (proposal instanceof OffchainThread) ? (proposal as OffchainThread).attachments : false;
    const proposalLink = `/${app.activeId()}/proposal/${proposal.slug}/${proposal.identifier}-`
      + `${slugify(proposal.title)}`;
    const proposalTitleIsEditable = (proposal instanceof SubstrateDemocracyProposal
      || proposal instanceof SubstrateCollectiveProposal
      || proposal instanceof SubstrateTreasuryTip
      || proposal instanceof SubstrateTreasuryProposal);

    return m('.ProposalHeader', {
      class: `proposal-${proposal.slug}`
    }, [
      m('.proposal-top', [
        m('.proposal-top-left', [
          !vnode.state.editing
            && m('.proposal-title', [
              m(ProposalHeaderTitle, { proposal }),
            ]),
          vnode.state.editing
            && m(ProposalTitleEditor, {
              item: proposal,
              getSetGlobalEditingStatus,
              parentState: vnode.state
            }),
          m('.proposal-body-meta', proposal instanceof OffchainThread
            ? [
              m(ProposalHeaderStage, { proposal }),
              m(ProposalHeaderTopics, { proposal }),
              m(ProposalBodyCreated, { item: proposal, link: proposalLink }),
              m(ProposalBodyLastEdited, { item: proposal }),
              m(ProposalBodyAuthor, { item: proposal }),
              m(ProposalHeaderViewCount, { viewCount }),
              app.isLoggedIn() && !getSetGlobalEditingStatus(GlobalStatus.Get) && m(PopoverMenu, {
                transitionDuration: 0,
                closeOnOutsideClick: true,
                closeOnContentClick: true,
                menuAttrs: { size: 'default' },
                content: [
                  (isEditor || isAuthor)
                    && m(ProposalBodyEditMenuItem, {
                      item: proposal, getSetGlobalReplyStatus, getSetGlobalEditingStatus, parentState: vnode.state,
                    }),
                  isAuthor && m(EditPermissionsButton, {
                    openEditPermissions: () => {
                      vnode.state.editPermissionsIsOpen = true;
                    }
                  }),
                  isAdmin && proposal instanceof OffchainThread && m(TopicEditorMenuItem, {
                    openTopicEditor: () => {
                      vnode.state.topicEditorIsOpen = true;
                    }
                  }),
                  (isAuthor || isAdmin)
                    && m(ProposalBodyDeleteMenuItem, { item: proposal }),
                  (isAuthor || isAdmin)
                    && m(ProposalHeaderPrivacyMenuItems, { proposal, getSetGlobalEditingStatus }),
                  (isAuthor || isAdmin) && (app.chain?.meta.chain.snapshot !== null)
                    && m(MenuItem, {
                      onclick: (e) => {
                        m.route.set(`/${app.activeChainId()}/new/snapshot-proposal/${app.chain.meta.chain.snapshot}`
                        + `?fromProposalType=${proposal.slug}&fromProposalId=${proposal.id}`);
                      },
                      label: 'Snapshot proposal from thread',
                    }),
                  (isAuthor || isAdmin)
                    && m(MenuDivider),
                  m(ThreadSubscriptionMenuItem, { proposal: proposal as OffchainThread }),
                ],
                inline: true,
                trigger: m(Icon, { name: Icons.CHEVRON_DOWN }),
              }),
              // This is the new social carat menu
              m('.CommentSocialHeader', [ m(SocialSharingCarat)]),
              vnode.state.editPermissionsIsOpen
                && proposal instanceof OffchainThread
                && m(ProposalEditorPermissions, {
                  thread: vnode.attrs.proposal as OffchainThread,
                  popoverMenu: true,
                  openStateHandler: (v) => {
                    vnode.state.editPermissionsIsOpen = v;
                  },
                  // TODO: Onchange logic
                  onChangeHandler: () => {},
                }),
              vnode.state.topicEditorIsOpen
                && proposal instanceof OffchainThread
                && m(TopicEditor, {
                  thread: vnode.attrs.proposal as OffchainThread,
                  popoverMenu: true,
                  onChangeHandler: (topic: OffchainTopic) => { proposal.topic = topic; m.redraw(); },
                  openStateHandler: (v) => { vnode.state.topicEditorIsOpen = v; m.redraw(); },
                }),
              vnode.attrs.stageEditorIsOpen
                && proposal instanceof OffchainThread
                && m(StageEditor, {
                  thread: vnode.attrs.proposal as OffchainThread,
                  popoverMenu: true,
                  onChangeHandler: (stage: OffchainThreadStage, chainEntities: ChainEntity[]) => {
                    proposal.stage = stage;
                    proposal.chainEntities = chainEntities;
                    m.redraw();
                  },
                  openStateHandler: (v) => {
                    if (!v) vnode.attrs.closeStageEditor();
                    m.redraw();
                  },
                }),
              vnode.attrs.pollEditorIsOpen
                && proposal instanceof OffchainThread
                && m(PollEditor, {
                  thread: vnode.attrs.proposal as OffchainThread,
                  onChangeHandler: () => {
                    vnode.attrs.closePollEditor();
                    m.redraw();
                  },
                }),
            ]
            : [
              m(ProposalHeaderOnchainId, { proposal }),
              m(ProposalHeaderOnchainStatus, { proposal }),
              m(ProposalBodyAuthor, { item: proposal }),
              app.isLoggedIn()
              && (isAdmin || isAuthor)
              && !getSetGlobalEditingStatus(GlobalStatus.Get)
              && proposalTitleIsEditable
              && m(PopoverMenu, {
                transitionDuration: 0,
                closeOnOutsideClick: true,
                closeOnContentClick: true,
                menuAttrs: { size: 'default' },
                content: [
                  m(ProposalTitleEditMenuItem, {
                    item: proposal,
                    getSetGlobalReplyStatus,
                    getSetGlobalEditingStatus,
                    parentState: vnode.state,
                  }),
                ],
                inline: true,
                trigger: m(Icon, { name: Icons.CHEVRON_DOWN }),
              }),
            ]),
          m('.proposal-body-link', [
            proposal instanceof OffchainThread
              && proposal.kind === OffchainThreadKind.Link
              && m(ProposalHeaderExternalLink, { proposal }),
            !(proposal instanceof OffchainThread)
              && (proposal['blockExplorerLink'] || proposal['votingInterfaceLink'] || proposal.threadId)
              && m('.proposal-body-link', [
                proposal.threadId && m(ProposalHeaderThreadLink, { proposal }),
                proposal['blockExplorerLink'] && m(ProposalHeaderBlockExplorerLink, { proposal }),
                proposal['votingInterfaceLink'] && m(ProposalHeaderVotingInterfaceLink, { proposal }),
              ]),
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

const ProposalComment: m.Component<{
  comment: OffchainComment<any>;
  getSetGlobalEditingStatus: CallableFunction;
  getSetGlobalReplyStatus: CallableFunction;
  parent: AnyProposal | OffchainComment<any> | OffchainThread;
  proposal: AnyProposal | OffchainThread;
  callback?: Function;
  isLast: boolean,
}, {
  editing: boolean;
  saving: boolean;
  replying: boolean;
  quillEditorState: any;
}> = {
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
          m('.CommentSocialHeader', [ m(SocialSharingCarat, { commentID: comment.id })])
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

const ProposalComments: m.Component<{
  proposal: OffchainThread | AnyProposal;
  comments: Array<OffchainComment<any>>;
  createdCommentCallback: CallableFunction;
  getSetGlobalEditingStatus: CallableFunction;
  getSetGlobalReplyStatus: CallableFunction;
  replyParent: number | boolean;
  user?: any;
}, {
  commentError: any;
  dom;
  highlightedComment: boolean;
}> = {
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

interface IPrefetch {
  [identifier: string]: {
    commentsStarted: boolean,
    viewCountStarted: boolean,
    profilesStarted: boolean,
    profilesFinished: boolean,
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
  threadFetchFailed,
  pollEditorIsOpen: boolean,
  stageEditorIsOpen: boolean,
  tipAmount: number,
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
    const headerTitle = m.route.param('type') === 'discussion' ? 'Discussions' : 'Proposals';
    if (typeof identifier !== 'string') return m(PageNotFound, { title: headerTitle });
    const proposalId = identifier.split('-')[0];
    const proposalType = type;
    const proposalIdAndType = `${proposalId}-${proposalType}`;

    // we will want to prefetch comments, profiles, and viewCount on the page before rendering anything
    if (!vnode.state.prefetch || !vnode.state.prefetch[proposalIdAndType]) {
      vnode.state.prefetch = {};
      vnode.state.prefetch[proposalIdAndType] = {
        commentsStarted: false,
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
      return m(PageLoading, { narrow: true, showNewProposalButton: true, title: headerTitle });
    }

    const proposalRecentlyEdited = vnode.state.recentlyEdited;
    const proposalDoesNotMatch = vnode.state.proposal
      && (+vnode.state.proposal.identifier !== +proposalId
          || vnode.state.proposal.slug !== proposalType);
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
        // proposal might be loading, if it's not an offchain thread
        if (proposalType === ProposalType.OffchainThread) {
          if (!vnode.state.threadFetched) {
            app.threads.fetchThread(+proposalId).then((res) => {
              vnode.state.proposal = res;
              m.redraw();
            }).catch((err) => {
              notifyError('Thread not found');
              vnode.state.threadFetchFailed = true;
            });
            vnode.state.threadFetched = true;
          }
          return m(PageLoading, { narrow: true, showNewProposalButton: true, title: headerTitle });
        } else {
          if (!app.chain.loaded) {
            return m(PageLoading, { narrow: true, showNewProposalButton: true, title: headerTitle });
          }
          // check if module is still initializing
          const c = proposalSlugToClass().get(proposalType) as ProposalModule<any, any, any>;
          if (!c) {
            return m(PageNotFound, { message: 'Invalid proposal type' });
          }
          if (!c.ready) {
            // TODO: perhaps we should be able to load here without fetching ALL proposal data
            // load sibling modules too
            if (app.chain.base === ChainBase.Substrate) {
              const chain = (app.chain as Substrate);
              app.chain.loadModules([
                chain.council,
                chain.technicalCommittee,
                chain.treasury,
                chain.democracyProposals,
                chain.democracy,
                chain.tips,
              ]);
            } else {
              app.chain.loadModules([ c ]);
            }
            return m(PageLoading, { narrow: true, showNewProposalButton: true, title: headerTitle });
          }
        }
        // proposal does not exist, 404
        return m(PageNotFound, { message: 'Proposal not found' });
      }
    }
    const { proposal } = vnode.state;
    if (proposalRecentlyEdited) vnode.state.recentlyEdited = false;
    if (identifier !== `${proposalId}-${slugify(proposal.title)}`) {
      m.route.set(`/${app.activeId()}/proposal/${proposal.slug}/${proposalId}-${slugify(proposal.title)}`, {},
        { replace: true });
    }

    // load comments
    if (!vnode.state.prefetch[proposalIdAndType]['commentsStarted']) {
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
      vnode.state.prefetch[proposalIdAndType]['commentsStarted'] = true;
    }

    if (vnode.state.comments?.length) {
      const mismatchedComments = vnode.state.comments.filter((c) => {
        return c.rootProposal !== `${vnode.attrs.type}_${proposalId}`;
      });
      if (mismatchedComments.length) {
        vnode.state.prefetch[proposalIdAndType]['commentsStarted'] = false;
      }
    }

    const createdCommentCallback = () => {
      vnode.state.comments = app.comments.getByProposal(proposal).filter((c) => c.parentComment === null);
      m.redraw();
    };

    // load view count
    if (!vnode.state.prefetch[proposalIdAndType]['viewCountStarted'] && proposal instanceof OffchainThread) {
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
      vnode.state.prefetch[proposalIdAndType]['viewCountStarted'] = true;
    } else if (!vnode.state.prefetch[proposalIdAndType]['viewCountStarted']) {
      // view counts currently not supported for proposals
      vnode.state.prefetch[proposalIdAndType]['viewCountStarted'] = true;
      vnode.state.viewCount = 0;
    }

    if (vnode.state.comments === undefined) {
      return m(PageLoading, { narrow: true, showNewProposalButton: true, title: headerTitle });
    }
    if (vnode.state.viewCount === undefined) {
      return m(PageLoading, { narrow: true, showNewProposalButton: true, title: headerTitle });
    }

    // load profiles
    // TODO: recursively fetch child comments as well (prevent reloading flash for threads with child comments)
    if (vnode.state.prefetch[proposalIdAndType]['profilesStarted'] === undefined) {
      if (proposal instanceof OffchainThread) {
        app.profiles.getProfile(proposal.authorChain, proposal.author);
      } else if (proposal.author instanceof Account) { // AnyProposal
        app.profiles.getProfile(proposal.author.chain.id, proposal.author.address);
      }
      vnode.state.comments.forEach((comment) => {
        app.profiles.getProfile(comment.authorChain, comment.author);
      });
      vnode.state.prefetch[proposalIdAndType]['profilesStarted'] = true;
    }
    if (!app.profiles.allLoaded() && !vnode.state.prefetch[proposalIdAndType]['profilesFinished']) {
      return m(PageLoading, { narrow: true, showNewProposalButton: true, title: headerTitle });
    }
    vnode.state.prefetch[proposalIdAndType]['profilesFinished'] = true;

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

    // Original posters have full editorial control, while added collaborators
    // merely have access to the body and title
    const { replyParent } = vnode.state;
    const { activeAccount } = app.user;

    const authorChain = (proposal instanceof OffchainThread) ? proposal.authorChain : app.activeId();
    const authorAddress = (proposal instanceof OffchainThread) ? proposal.author : proposal.author?.address;
    const isAuthor = (activeAccount?.address === authorAddress && activeAccount?.chain.id === authorChain);
    const isEditor = (proposal as OffchainThread).collaborators?.filter((c) => {
      return (c.address === activeAccount?.address && c.chain === activeAccount?.chain.id);
    }).length > 0;
    const isAdmin = (app.user.isRoleOfCommunity({
      role: 'admin',
      chain: app.activeChainId(),
      community: app.activeCommunityId()
    }) || app.user.isRoleOfCommunity({
      role: 'moderator',
      chain: app.activeChainId(),
      community: app.activeCommunityId()
    }));

    if (proposal instanceof SubstrateTreasuryTip) {
      const { author, title, data:{ who, reason } } = proposal;
      const contributors = proposal.getVotes();

      return m(Sublayout, { class: 'ViewProposalPage', showNewProposalButton: true, title: headerTitle }, [
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
              m('.tip-reason', [
                m(MarkdownFormattedText, { doc: reason }),
              ]),
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
            proposal.canVoteFrom(app.user.activeAccount as SubstrateAccount)
            && m('.contribute', [
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
                    vnode.state.tipAmount = result.length > 0
                      ? app.chain.chain.coins(parseFloat(result), true) : undefined;
                    m.redraw();
                  },
                })
              ]),
              m(Button, {
                disabled: vnode.state.tipAmount === undefined,
                intent: 'primary',
                rounded: true,
                label: 'Submit Transaction',
                onclick: (e) => {
                  e.preventDefault();
                  createTXModal(proposal.submitVoteTx(
                    new DepositVote(app.user.activeAccount, vnode.state.tipAmount)
                  ));
                },
                tabindex: 4,
                type: 'submit',
              }),
            ]),
            contributors.length > 0 && [
              m('.contributors .title', 'Contributors'),
              contributors.map(({ account, deposit }) => (
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
              )),
            ]
          ]),
        ]),
      ]);
    }

    return m(Sublayout, {
      class: 'ViewProposalPage',
      showNewProposalButton: true,
      title: headerTitle,
      rightContent: [
        proposal instanceof OffchainThread
          && proposal.hasOffchainPoll
          && m(ProposalHeaderOffchainPoll, { proposal }),
        proposal instanceof OffchainThread
          && isAuthor
          && !proposal.offchainVotingEndsAt
          && m(ProposalSidebarPollEditorModule, {
            proposal,
            openPollEditor: () => {
              vnode.state.pollEditorIsOpen = true;
            }
          }),
        (isAuthor || isAdmin) && proposal instanceof OffchainThread
          && m(ProposalSidebarStageEditorModule, {
            proposal,
            openStageEditor: () => {
              vnode.state.stageEditorIsOpen = true;
            }
          }),
      ]
    }, [
      m(ProposalHeader, {
        proposal,
        commentCount,
        viewCount,
        getSetGlobalEditingStatus,
        getSetGlobalReplyStatus,
        isAuthor,
        isEditor,
        isAdmin,
        stageEditorIsOpen: vnode.state.stageEditorIsOpen,
        pollEditorIsOpen: vnode.state.pollEditorIsOpen,
        closeStageEditor: () => { vnode.state.stageEditorIsOpen = false; m.redraw(); },
        closePollEditor: () => { vnode.state.pollEditorIsOpen = false; m.redraw(); },
      }),
      !(proposal instanceof OffchainThread)
        && m(LinkedProposalsEmbed, { proposal }),
      !(proposal instanceof OffchainThread)
        && m(ProposalVotingResults, { proposal }),
      !(proposal instanceof OffchainThread)
        && m(ProposalVotingActions, { proposal }),
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
