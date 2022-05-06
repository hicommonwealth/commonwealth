import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import {
  PopoverMenu,
  MenuDivider,
  MenuItem,
  Button,
  Input,
} from 'construct-ui';

import 'pages/view_proposal/index.scss';
import 'pages/view_proposal/tips.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import Sublayout from 'views/sublayout';
import { ProposalType, ChainBase } from 'types';
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
  OffchainThread,
  OffchainThreadKind,
  OffchainComment,
  OffchainTopic,
  OffchainThreadStage,
  AnyProposal,
  Account,
  ChainEntity,
  ProposalModule,
  DepositVote,
} from 'models';

import jumpHighlightComment from 'views/pages/view_proposal/jump_to_comment';
import { TopicEditor } from 'views/components/topic_editor';
import { StageEditor } from 'views/components/stage_editor';
import { PollEditor } from 'views/components/poll_editor';
import {
  TopicEditorMenuItem,
  ThreadSubscriptionMenuItem,
} from 'views/pages/discussions/discussion_row_menu';
import ProposalVotingActions, {
  CancelButton,
  ExecuteButton,
  QueueButton,
} from 'views/components/proposals/voting_actions';
import ProposalVotingResults from 'views/components/proposals/voting_results';
import { PageLoading } from 'views/pages/loading';
import { PageNotFound } from 'views/pages/404';

import SubstrateDemocracyProposal from 'controllers/chain/substrate/democracy_proposal';
import { SubstrateCollectiveProposal } from 'controllers/chain/substrate/collective_proposal';
import { SubstrateTreasuryProposal } from 'controllers/chain/substrate/treasury_proposal';
import { SubstrateTreasuryTip } from 'controllers/chain/substrate/treasury_tip';

import { SocialSharingCarat } from 'views/components/social_sharing_carat';

import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import { modelFromServer as modelReactionCountFromServer } from 'controllers/server/reactionCounts';
import { SnapshotProposal } from 'helpers/snapshot_utils';
import OffchainPoll from 'client/scripts/models/OffchainPoll';
import {
  ProposalHeaderTopics,
  ProposalHeaderTitle,
  ProposalHeaderStage,
  ProposalHeaderOnchainId,
  ProposalHeaderOnchainStatus,
  ProposalHeaderViewCount,
  ProposalHeaderPrivacyMenuItems,
  ProposalTitleEditor,
  ProposalTitleEditMenuItem,
  ProposalLinkEditor,
  // ProposalHeaderLinkThreadsMenuItem,
} from './header';
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
  EditPermissionsButton,
  ProposalEditorPermissions,
} from './body';
import CreateComment from './create_comment';
import LinkedProposalsEmbed from './linked_proposals_embed';
import User from '../../components/widgets/user';
import MarkdownFormattedText from '../../components/markdown_formatted_text';
import { createTXModal } from '../../modals/tx_signing_modal';
import { SubstrateAccount } from '../../../controllers/chain/substrate/account';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { InlineReplyButton } from '../../components/inline_reply_button';
import { PollEditorCard } from './poll_editor_card';
import { LinkedProposalsCard } from './linked_proposals_card';
import { LinkedThreadsCard } from './linked_threads_card';
import { CommentReactionButton } from '../../components/reaction_button/comment_reaction_button';
import { ThreadReactionButton } from '../../components/reaction_button/thread_reaction_button';
import { ProposalPoll } from './poll';
import {
  ProposalHeaderExternalLink,
  ProposalHeaderThreadLink,
  ProposalHeaderBlockExplorerLink,
  ProposalHeaderVotingInterfaceLink,
} from './proposal_header_links';

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
  comments: OffchainComment<OffchainThread>[];
  polls: OffchainPoll[];
  editing: boolean;
  highlightedComment: boolean;
  parentCommentId: number; // if null or undefined, reply is thread-scoped
  pollEditorIsOpen: boolean;
  prefetch: IPrefetch;
  proposal: AnyProposal | OffchainThread;
  recentlyEdited: boolean;
  recentlySubmitted: number; // comment ID for CSS highlight transitions
  replying: boolean;
  stageEditorIsOpen: boolean;
  threadFetched;
  threadFetchFailed;
  tipAmount: number;
  viewCount: number;
}

const scrollToForm = (parentId?: number) => {
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

const ProposalHeader: m.Component<
  {
    commentCount: number;
    viewCount: number;
    getSetGlobalEditingStatus: CallableFunction;
    proposalPageState: IProposalPageState;
    proposal: AnyProposal | OffchainThread;
    isAuthor: boolean;
    isEditor: boolean;
    isAdmin: boolean;
    stageEditorIsOpen: boolean;
    pollEditorIsOpen: boolean;
    closePollEditor: Function;
    closeStageEditor: Function;
  },
  {
    savedEdit: string;
    editing: boolean;
    saving: boolean;
    quillEditorState: any;
    currentText: any;
    topicEditorIsOpen: boolean;
    editPermissionsIsOpen: boolean;
    updatedTitle: string;
    updatedUrl: string;
  }
> = {
  view: (vnode) => {
    const {
      commentCount,
      proposal,
      getSetGlobalEditingStatus,
      proposalPageState,
      viewCount,
      isAuthor,
      isEditor,
      isAdmin,
    } = vnode.attrs;
    const attachments =
      proposal instanceof OffchainThread
        ? (proposal as OffchainThread).attachments
        : false;
    const proposalLink = getProposalUrlPath(
      proposal.slug,
      `${proposal.identifier}-${slugify(proposal.title)}`
    );
    const proposalTitleIsEditable =
      proposal instanceof SubstrateDemocracyProposal ||
      proposal instanceof SubstrateCollectiveProposal ||
      proposal instanceof SubstrateTreasuryTip ||
      proposal instanceof SubstrateTreasuryProposal;

    const hasBody = !!(proposal as AnyProposal).description;

    return m(
      '.ProposalHeader',
      {
        class: `proposal-${proposal.slug}`,
      },
      [
        m('.proposal-top', [
          m('.proposal-top-left', [
            !(proposal instanceof OffchainThread) &&
              m('.proposal-meta-top', [
                m('.proposal-meta-top-left', [
                  m(ProposalHeaderOnchainId, { proposal }),
                ]),
                m('.proposal-meta-top-right', [
                  m(QueueButton, { proposal }),
                  m(ExecuteButton, { proposal }),
                  m(CancelButton, { proposal }),
                ]),
              ]),
            !vnode.state.editing &&
              m('.proposal-title', [m(ProposalHeaderTitle, { proposal })]),
            vnode.state.editing &&
              m(ProposalTitleEditor, {
                item: proposal,
                getSetGlobalEditingStatus,
                parentState: vnode.state,
              }),
            m(
              '.proposal-body-meta',
              proposal instanceof OffchainThread
                ? [
                    m(ProposalHeaderStage, { proposal }),
                    m(ProposalHeaderTopics, { proposal }),
                    m(ProposalBodyCreated, {
                      item: proposal,
                      link: proposalLink,
                    }),
                    m(ProposalBodyLastEdited, { item: proposal }),
                    m(ProposalBodyAuthor, { item: proposal }),
                    m(ProposalHeaderViewCount, { viewCount }),
                    app.isLoggedIn() &&
                      !getSetGlobalEditingStatus(GlobalStatus.Get) &&
                      m(PopoverMenu, {
                        transitionDuration: 0,
                        closeOnOutsideClick: true,
                        closeOnContentClick: true,
                        menuAttrs: { size: 'default' },
                        content: [
                          (isEditor || isAuthor || isAdmin) &&
                            m(ProposalBodyEditMenuItem, {
                              item: proposal,
                              proposalPageState: vnode.attrs.proposalPageState,
                              getSetGlobalEditingStatus,
                              parentState: vnode.state,
                            }),
                          isAuthor &&
                            m(EditPermissionsButton, {
                              openEditPermissions: () => {
                                vnode.state.editPermissionsIsOpen = true;
                              },
                            }),
                          isAdmin &&
                            proposal instanceof OffchainThread &&
                            m(TopicEditorMenuItem, {
                              openTopicEditor: () => {
                                vnode.state.topicEditorIsOpen = true;
                              },
                            }),
                          (isAuthor || isAdmin || app.user.isSiteAdmin) &&
                            m(ProposalBodyDeleteMenuItem, { item: proposal }),
                          (isAuthor || isAdmin) &&
                            m(ProposalHeaderPrivacyMenuItems, {
                              proposal,
                              getSetGlobalEditingStatus,
                            }),
                          (isAuthor || isAdmin) &&
                            app.chain?.meta.chain.snapshot.length > 0 &&
                            m(MenuItem, {
                              onclick: () => {
                                const snapshotSpaces =
                                  app.chain.meta.chain.snapshot;
                                if (snapshotSpaces.length > 1) {
                                  navigateToSubpage('/multiple-snapshots', {
                                    action: 'create-from-thread',
                                    proposal,
                                  });
                                } else {
                                  navigateToSubpage(
                                    `/snapshot/${snapshotSpaces}`
                                  );
                                }
                              },
                              label: 'Snapshot proposal from thread',
                            }),
                          // (isAuthor || isAdmin) &&
                          //   m(ProposalHeaderLinkThreadsMenuItem, {
                          //     item: proposal,
                          //   }),
                          (isAuthor || isAdmin) && m(MenuDivider),
                          m(ThreadSubscriptionMenuItem, {
                            proposal: proposal as OffchainThread,
                          }),
                        ],
                        inline: true,
                        trigger: m(CWIcon, {
                          iconName: 'chevronDown',
                          iconSize: 'small',
                        }),
                      }),
                    !app.isCustomDomain() &&
                      m('.CommentSocialHeader', [m(SocialSharingCarat)]),
                    vnode.state.editPermissionsIsOpen &&
                      proposal instanceof OffchainThread &&
                      m(ProposalEditorPermissions, {
                        thread: vnode.attrs.proposal as OffchainThread,
                        popoverMenu: true,
                        openStateHandler: (v) => {
                          vnode.state.editPermissionsIsOpen = v;
                        },
                        // TODO: Onchange logic
                        onChangeHandler: () => {},
                      }),
                    vnode.state.topicEditorIsOpen &&
                      proposal instanceof OffchainThread &&
                      m(TopicEditor, {
                        thread: vnode.attrs.proposal as OffchainThread,
                        popoverMenu: true,
                        onChangeHandler: (topic: OffchainTopic) => {
                          proposal.topic = topic;
                          m.redraw();
                        },
                        openStateHandler: (v) => {
                          vnode.state.topicEditorIsOpen = v;
                          m.redraw();
                        },
                      }),
                    vnode.attrs.stageEditorIsOpen &&
                      proposal instanceof OffchainThread &&
                      m(StageEditor, {
                        thread: vnode.attrs.proposal as OffchainThread,
                        popoverMenu: true,
                        onChangeHandler: (
                          stage: OffchainThreadStage,
                          chainEntities: ChainEntity[],
                          snapshotProposal: SnapshotProposal[]
                        ) => {
                          proposal.stage = stage;
                          proposal.chainEntities = chainEntities;
                          if (app.chain?.meta.chain.snapshot) {
                            proposal.snapshotProposal = snapshotProposal[0]?.id;
                          }
                          app.threads.fetchThreadsFromId([proposal.identifier]);
                          m.redraw();
                        },
                        openStateHandler: (v) => {
                          if (!v) vnode.attrs.closeStageEditor();
                          m.redraw();
                        },
                      }),
                    vnode.attrs.pollEditorIsOpen &&
                      proposal instanceof OffchainThread &&
                      m(PollEditor, {
                        thread: vnode.attrs.proposal as OffchainThread,
                        onChangeHandler: () => {
                          vnode.attrs.closePollEditor();
                          m.redraw();
                        },
                      }),
                  ]
                : [
                    m(ProposalBodyAuthor, { item: proposal }),
                    m(ProposalHeaderOnchainStatus, { proposal }),
                    app.isLoggedIn() &&
                      (isAdmin || isAuthor) &&
                      !getSetGlobalEditingStatus(GlobalStatus.Get) &&
                      proposalTitleIsEditable &&
                      m(PopoverMenu, {
                        transitionDuration: 0,
                        closeOnOutsideClick: true,
                        closeOnContentClick: true,
                        menuAttrs: { size: 'default' },
                        content: [
                          m(ProposalTitleEditMenuItem, {
                            item: proposal,
                            proposalPageState,
                            getSetGlobalEditingStatus,
                            parentState: vnode.state,
                          }),
                        ],
                        inline: true,
                        trigger: m(CWIcon, {
                          iconName: 'chevronDown',
                          iconSize: 'small',
                        }),
                      }),
                  ]
            ),
            m('.proposal-body-link', [
              proposal instanceof OffchainThread &&
                proposal.kind === OffchainThreadKind.Link && [
                  vnode.state.editing
                    ? m(ProposalLinkEditor, {
                        item: proposal,
                        parentState: vnode.state,
                      })
                    : m(ProposalHeaderExternalLink, { proposal }),
                ],
              !(proposal instanceof OffchainThread) &&
                (proposal['blockExplorerLink'] ||
                  proposal['votingInterfaceLink'] ||
                  proposal.threadId) &&
                m('.proposal-body-link', [
                  proposal.threadId &&
                    m(ProposalHeaderThreadLink, { proposal }),
                  proposal['blockExplorerLink'] &&
                    m(ProposalHeaderBlockExplorerLink, { proposal }),
                  proposal['votingInterfaceLink'] &&
                    m(ProposalHeaderVotingInterfaceLink, { proposal }),
                ]),
            ]),
          ]),
        ]),
        proposal instanceof OffchainThread &&
          m('.proposal-content', [
            (commentCount > 0 || app.user.activeAccount) &&
              m('.thread-connector'),
            m('.proposal-content-left', [
              m(ProposalBodyAvatar, { item: proposal }),
            ]),
            m('.proposal-content-right', [
              !vnode.state.editing && m(ProposalBodyText, { item: proposal }),
              !vnode.state.editing &&
                attachments &&
                attachments.length > 0 &&
                m(ProposalBodyAttachments, { item: proposal }),
              vnode.state.editing &&
                m(ProposalBodyEditor, {
                  item: proposal,
                  parentState: vnode.state,
                }),
              m('.proposal-body-bottom', [
                vnode.state.editing &&
                  m('.proposal-body-button-group', [
                    m(ProposalBodySaveEdit, {
                      item: proposal,
                      getSetGlobalEditingStatus,
                      parentState: vnode.state,
                    }),
                    m(ProposalBodyCancelEdit, {
                      item: proposal,
                      getSetGlobalEditingStatus,
                      parentState: vnode.state,
                    }),
                  ]),
                !vnode.state.editing &&
                  m('.proposal-response-row', [
                    m(ThreadReactionButton, {
                      thread: proposal,
                    }),
                    m(InlineReplyButton, {
                      commentReplyCount: commentCount,
                      onclick: () => {
                        if (!proposalPageState.replying) {
                          proposalPageState.replying = true;
                          scrollToForm();
                        } else if (!proposalPageState.parentCommentId) {
                          // If user is already replying to top-level, cancel reply
                          proposalPageState.replying = false;
                        }
                        proposalPageState.parentCommentId = null;
                      },
                    }),
                  ]),
              ]),
            ]),
          ]),
        !(proposal instanceof OffchainThread) &&
          hasBody &&
          m('.proposal-content', [m(ProposalBodyText, { item: proposal })]),
      ]
    );
  },
};

const ProposalComment: m.Component<
  {
    comment: OffchainComment<any>;
    getSetGlobalEditingStatus: CallableFunction;
    proposalPageState: IProposalPageState;
    parent: AnyProposal | OffchainComment<any> | OffchainThread;
    proposal: AnyProposal | OffchainThread;
    callback?: Function;
    isAdmin?: boolean;
    isLast: boolean;
  },
  {
    editing: boolean;
    saving: boolean;
    replying: boolean;
    quillEditorState: any;
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
                trigger: m(CWIcon, {
                  iconName: 'chevronDown',
                  iconSize: 'small',
                }),
              }),
            ],
            !app.isCustomDomain() &&
              m('.CommentSocialHeader', [
                m(SocialSharingCarat, { commentID: comment.id }),
              ]),
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
    proposal: OffchainThread | AnyProposal;
    comments: Array<OffchainComment<any>>;
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
      comments_: OffchainComment<any>[],
      parent: AnyProposal | OffchainThread | OffchainComment<any>,
      threadLevel: number
    ) => {
      const canContinueThreading = threadLevel <= MAX_THREAD_LEVEL;
      return comments_.map((comment: OffchainComment<any>, idx) => {
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
        class: app.user.activeAccount ? '' : 'no-active-account',
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
          m('.comments-error', vnode.state.commentError),
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
  oncreate: (vnode) => {
    // writes type field if accessed as /proposal/XXX (shortcut for non-substrate chains)
    mixpanel.track('PageVisit', { 'Page Name': 'ViewProposalPage' });
    mixpanel.track('Proposal Funnel', {
      'Step No': 1,
      Step: 'Viewing Proposal',
      'Proposal Name': `${vnode.attrs.type}: ${vnode.attrs.identifier}`,
      Scope: app.activeChainId(),
    });
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
        ? ProposalType.OffchainThread
        : chainToProposalSlug(app.chain.meta.chain));
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
        // proposal might be loading, if it's not an offchain thread
        if (proposalType === ProposalType.OffchainThread) {
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
    if (!vnode.state.prefetch[proposalIdAndType]['pollsStarted']) {
      app.polls
        .fetchPolls(app.activeChainId(), (proposal as OffchainThread).id)
        .catch(() => {
          notifyError('Failed to load comments');
          vnode.state.comments = [];
          m.redraw();
        });
      vnode.state.prefetch[proposalIdAndType]['pollsStarted'] = true;
    } else {
      vnode.state.polls = app.polls.getByThreadId(
        (proposal as OffchainThread).id
      );
    }

    // load view count
    if (
      !vnode.state.prefetch[proposalIdAndType]['viewCountStarted'] &&
      proposal instanceof OffchainThread
    ) {
      $.post(`${app.serverUrl()}/viewCount`, {
        chain: app.activeChainId(),
        object_id: proposal.id, // (proposal instanceof OffchainThread) ? proposal.id : proposal.slug,
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
      if (proposal instanceof OffchainThread) {
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
      proposal instanceof OffchainThread ? 0 : proposal.getVotes().length;

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
      proposal instanceof OffchainThread
        ? proposal.authorChain
        : app.activeChainId();
    const authorAddress =
      proposal instanceof OffchainThread
        ? proposal.author
        : proposal.author?.address;
    const isAuthor =
      activeAccount?.address === authorAddress &&
      activeAccount?.chain.id === authorChain;
    const isEditor =
      (proposal as OffchainThread).collaborators?.filter((c) => {
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
      (proposal as OffchainThread).snapshotProposal?.length > 0 ||
      (proposal as OffchainThread).chainEntities?.length > 0 ||
      isAuthor ||
      isAdminOrMod;
    const showLinkedThreadOptions =
      (proposal as OffchainThread).linkedThreads?.length > 0 ||
      isAuthor ||
      isAdminOrMod;

    return m(
      Sublayout,
      {
        showNewProposalButton: true,
        title: headerTitle,
      },
      m('.ViewProposalPage', [
        m('.view-proposal-page-container', [
          [
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
              pollEditorIsOpen: vnode.state.pollEditorIsOpen,
              closeStageEditor: () => {
                vnode.state.stageEditorIsOpen = false;
                m.redraw();
              },
              closePollEditor: () => {
                vnode.state.pollEditorIsOpen = false;
                m.redraw();
              },
            }),
            !(proposal instanceof OffchainThread) &&
              m(LinkedProposalsEmbed, { proposal }),
            proposal instanceof AaveProposal && [
              m(AaveViewProposalSummary, { proposal }),
              m(AaveViewProposalDetail, { proposal }),
            ],
            !(proposal instanceof OffchainThread) &&
              m(ProposalVotingResults, { proposal }),
            !(proposal instanceof OffchainThread) &&
              m(ProposalVotingActions, { proposal }),
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
          ],
        ]),
        m('.right-content-container', [
          [
            showLinkedSnapshotOptions &&
              proposal instanceof OffchainThread &&
              m(LinkedProposalsCard, {
                proposal,
                openStageEditor: () => {
                  vnode.state.stageEditorIsOpen = true;
                },
                showAddProposalButton: isAuthor || isAdminOrMod,
              }),
            showLinkedThreadOptions &&
              proposal instanceof OffchainThread &&
              m(LinkedThreadsCard, {
                proposalId: proposal.id,
                allowLinking: isAuthor || isAdminOrMod,
              }),
            proposal instanceof OffchainThread &&
              isAuthor &&
              (!app.chain?.meta?.chain?.adminOnlyPolling || isAdmin) &&
              m(PollEditorCard, {
                proposal,
                proposalAlreadyHasPolling: !vnode.state.polls?.length,
                openPollEditor: () => {
                  vnode.state.pollEditorIsOpen = true;
                },
              }),
            proposal instanceof OffchainThread &&
              [
                ...new Map(
                  vnode.state.polls?.map((poll) => [poll.id, poll])
                ).values(),
              ].map((poll) => {
                return m(ProposalPoll, { poll, thread: proposal });
              }),
          ],
        ]),
      ])
    );
  },
};

export default ViewProposalPage;
