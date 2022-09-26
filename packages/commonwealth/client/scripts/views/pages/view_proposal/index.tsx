/* @jsx m */

import $ from 'jquery';
import m from 'mithril';
import { Button, Input } from 'construct-ui';
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
import {
  Comment,
  Poll,
  Thread,
  Account,
  ProposalModule,
  DepositVote,
  ThreadStage,
  ChainEntity,
  AnyProposal,
} from 'models';
import { SnapshotProposal } from 'helpers/snapshot_utils';
import { VotingResults } from 'views/components/proposals/voting_results';
import { VotingActions } from 'views/components/proposals/voting_actions';
import { PageLoading } from 'views/pages/loading';
import { PageNotFound } from 'views/pages/404';
import { SubstrateTreasuryTip } from 'controllers/chain/substrate/treasury_tip';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import { modelFromServer as modelReactionCountFromServer } from 'controllers/server/reactionCounts';
import { IBalanceAccount } from 'models/interfaces';
import { CreateComment } from './create_comment';
import { LinkedProposalsEmbed } from './linked_proposals_embed';
import User from '../../components/widgets/user';
import { MarkdownFormattedText } from '../../components/quill/markdown_formatted_text';
import { createTXModal } from '../../modals/tx_signing_modal';
import { SubstrateAccount } from '../../../controllers/chain/substrate/account';
import { PollEditorCard } from './poll_editor_card';
import { LinkedProposalsCard } from './linked_proposals_card';
import { LinkedThreadsCard } from './linked_threads_card';
import {
  activeQuillEditorHasText,
  getProposalPollTimestamp,
  handleProposalPollVote,
} from './helpers';
import { PollCard } from '../../components/poll_card';
import { OffchainVotingModal } from '../../modals/offchain_voting_modal';
import { CWTabBar, CWTab } from '../../components/component_kit/cw_tabs';
import {
  getClasses,
  isWindowMediumSmallInclusive,
} from '../../components/component_kit/helpers';
import { ProposalHeader } from './proposal_header';
import { AaveViewProposalDetail } from './aave_summary';
import { GlobalStatus, Prefetch } from './types';
import { ProposalComments } from './proposal_comments';

class ViewProposalPage
  implements
    m.ClassComponent<{
      identifier: string;
      type?: string;
    }>
{
  private comments: Comment<Thread>[];
  private polls: Poll[];
  private editing: boolean;
  private highlightedComment: boolean;
  private parentCommentId: number; // if null or undefined, reply is thread-scoped
  private prefetch: Prefetch;
  private proposal: AnyProposal | Thread;
  private recentlyEdited: boolean;
  private recentlySubmitted: number; // comment ID for CSS highlight transitions
  private replying: boolean;
  private tabSelected: 'viewProposal' | 'viewSidebar';
  private threadFetched;
  private threadFetchFailed;
  private tipAmount: number;
  private viewCount: number;

  oninit() {
    this.tabSelected = 'viewProposal';
  }

  oncreate() {
    // writes type field if accessed as /proposal/XXX (shortcut for non-substrate chains)

    if (!this.editing) {
      this.editing = false;
    }
  }

  view(vnode) {
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
      return <PageNotFound title={headerTitle} />;

    const proposalId = identifier.split('-')[0];
    const proposalType = type;
    const proposalIdAndType = `${proposalId}-${proposalType}`;

    // we will want to prefetch comments, profiles, and viewCount on the page before rendering anything
    if (!this.prefetch || !this.prefetch[proposalIdAndType]) {
      this.prefetch = {};
      this.prefetch[proposalIdAndType] = {
        commentsStarted: false,
        pollsStarted: false,
        viewCountStarted: false,
        profilesStarted: false,
        profilesFinished: false,
      };
    }

    if (this.threadFetchFailed) {
      return <PageNotFound title={headerTitle} />;
    }

    // load app controller
    if (!app.threads.initialized) {
      return <PageLoading showNewProposalButton title={headerTitle} />;
    }

    const proposalRecentlyEdited = this.recentlyEdited;

    const proposalDoesNotMatch =
      this.proposal &&
      (+this.proposal.identifier !== +proposalId ||
        this.proposal.slug !== proposalType);

    if (proposalDoesNotMatch) {
      this.proposal = undefined;
      this.recentlyEdited = false;
      this.threadFetched = false;
    }

    // load proposal, and return m(PageLoading)
    if (!this.proposal || proposalRecentlyEdited) {
      try {
        this.proposal = idToProposal(proposalType, proposalId);
      } catch (e) {
        // proposal might be loading, if it's not an thread
        if (proposalType === ProposalType.Thread) {
          if (!this.threadFetched) {
            app.threads
              .fetchThreadsFromId([+proposalId])
              .then((res) => {
                this.proposal = res[0];
                m.redraw();
              })
              .catch(() => {
                notifyError('Thread not found');
                this.threadFetchFailed = true;
              });
            this.threadFetched = true;
          }
          return <PageLoading showNewProposalButton title={headerTitle} />;
        } else {
          if (!app.chain.loaded) {
            return <PageLoading showNewProposalButton title={headerTitle} />;
          }
          // check if module is still initializing
          const c = proposalSlugToClass().get(proposalType) as ProposalModule<
            any,
            any,
            any
          >;
          if (!c) {
            return <PageNotFound message="Invalid proposal type" />;
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
            return <PageLoading showNewProposalButton title={headerTitle} />;
          }
        }
        // proposal does not exist, 404
        return <PageNotFound message="Proposal not found" />;
      }
    }

    const { proposal } = this;

    if (proposalRecentlyEdited) this.recentlyEdited = false;

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
    if (!this.prefetch[proposalIdAndType]['threadReactionsStarted']) {
      app.threads.fetchReactionsCount([proposal]).then(() => m.redraw);
      this.prefetch[proposalIdAndType]['threadReactionsStarted'] = true;
    }

    // load comments
    if (!this.prefetch[proposalIdAndType]['commentsStarted']) {
      app.comments
        .refresh(proposal, app.activeChainId())
        .then(async () => {
          this.comments = app.comments
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
          this.comments = [];
          m.redraw();
        });
      this.prefetch[proposalIdAndType]['commentsStarted'] = true;
    }

    if (this.comments?.length) {
      const mismatchedComments = this.comments.filter((c) => {
        return c.rootProposal !== `${type}_${proposalId}`;
      });
      if (mismatchedComments.length) {
        this.prefetch[proposalIdAndType]['commentsStarted'] = false;
      }
    }

    const createdCommentCallback = () => {
      this.comments = app.comments
        .getByProposal(proposal)
        .filter((c) => c.parentComment === null);
      m.redraw();
    };

    // load polls
    if (
      proposal instanceof Thread &&
      !this.prefetch[proposalIdAndType]['pollsStarted']
    ) {
      app.polls.fetchPolls(app.activeChainId(), proposal.id).catch(() => {
        notifyError('Failed to load comments');
        this.comments = [];
        m.redraw();
      });
      this.prefetch[proposalIdAndType]['pollsStarted'] = true;
    } else if (proposal instanceof Thread) {
      this.polls = app.polls.getByThreadId(proposal.id);
    }

    // load view count
    if (
      !this.prefetch[proposalIdAndType]['viewCountStarted'] &&
      proposal instanceof Thread
    ) {
      $.post(`${app.serverUrl()}/viewCount`, {
        chain: app.activeChainId(),
        object_id: proposal.id, // (proposal instanceof Thread) ? proposal.id : proposal.slug,
      })
        .then((response) => {
          if (response.status !== 'Success') {
            this.viewCount = 0;
            throw new Error(`got unsuccessful status: ${response.status}`);
          } else {
            this.viewCount = response.result.view_count;
            m.redraw();
          }
        })
        .catch(() => {
          this.viewCount = 0;
          throw new Error('could not load view count');
        });
      this.prefetch[proposalIdAndType]['viewCountStarted'] = true;
    } else if (!this.prefetch[proposalIdAndType]['viewCountStarted']) {
      // view counts currently not supported for proposals
      this.prefetch[proposalIdAndType]['viewCountStarted'] = true;
      this.viewCount = 0;
    }

    if (this.comments === undefined || this.viewCount === undefined) {
      return <PageLoading showNewProposalButton title={headerTitle} />;
    }

    // load profiles
    if (this.prefetch[proposalIdAndType]['profilesStarted'] === undefined) {
      if (proposal instanceof Thread) {
        app.profiles.getProfile(proposal.authorChain, proposal.author);
      } else if (proposal.author instanceof Account) {
        // AnyProposal
        app.profiles.getProfile(
          proposal.author.chain.id,
          proposal.author.address
        );
      }
      this.comments.forEach((comment) => {
        app.profiles.getProfile(comment.authorChain, comment.author);
      });
      this.prefetch[proposalIdAndType]['profilesStarted'] = true;
    }
    if (
      !app.profiles.allLoaded() &&
      !this.prefetch[proposalIdAndType]['profilesFinished']
    ) {
      return <PageLoading showNewProposalButton title={headerTitle} />;
    }
    this.prefetch[proposalIdAndType]['profilesFinished'] = true;

    const windowListener = (e) => {
      if (this.editing || activeQuillEditorHasText()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', windowListener);

    const comments = this.comments;
    const viewCount: number = this.viewCount;
    const commentCount: number = app.comments.nComments(proposal);

    const getSetGlobalEditingStatus = (call: string, status?: boolean) => {
      if (call === GlobalStatus.Get) return this.editing;

      if (call === GlobalStatus.Set && status !== undefined) {
        this.editing = status;
        if (status === false) {
          this.recentlyEdited = true;
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
      app.roles.isRoleOfCommunity({
        role: 'admin',
        chain: app.activeChainId(),
      }) ||
      app.roles.isRoleOfCommunity({
        role: 'moderator',
        chain: app.activeChainId(),
      });

    const isAdmin = app.roles.isRoleOfCommunity({
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
                        this.tipAmount =
                          result.length > 0
                            ? app.chain.chain.coins(parseFloat(result), true)
                            : undefined;
                        m.redraw();
                      },
                    }),
                  ]),
                  m(Button, {
                    disabled: this.tipAmount === undefined,
                    intent: 'primary',
                    rounded: true,
                    label: 'Submit Transaction',
                    onclick: (e) => {
                      e.preventDefault();
                      createTXModal(
                        proposal.submitVoteTx(
                          new DepositVote(
                            app.user.activeAccount as IBalanceAccount<any>,
                            app.chain.chain.coins(this.tipAmount)
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
        this.tabSelected !== 'viewProposal'
      ) {
        this.tabSelected = 'viewProposal';
        m.redraw();
      }
    };

    const sidebarCheck =
      showLinkedSnapshotOptions ||
      showLinkedThreadOptions ||
      (proposal instanceof Thread && this.polls?.length > 0) ||
      (proposal instanceof Thread && isAuthor);

    return (
      <Sublayout showNewProposalButton title={headerTitle}>
        <div class="ViewProposalPage">
          {sidebarCheck && (
            <div class="view-proposal-body-with-tabs">
              <CWTabBar>
                <CWTab
                  label="Proposal"
                  onclick={() => {
                    this.tabSelected = 'viewProposal';
                  }}
                  isSelected={this.tabSelected === 'viewProposal'}
                />
                <CWTab
                  label="Info & Results"
                  onclick={() => {
                    this.tabSelected = 'viewSidebar';
                  }}
                  isSelected={this.tabSelected === 'viewSidebar'}
                />
              </CWTabBar>
              {this.tabSelected === 'viewProposal' && (
                <>
                  <div class="view-proposal-content-container">
                    <ProposalHeader
                      proposal={proposal}
                      commentCount={commentCount}
                      viewCount={viewCount}
                      getSetGlobalEditingStatus={getSetGlobalEditingStatus}
                      proposalPageState={this}
                      isAuthor={isAuthor}
                      isEditor={isEditor}
                      isAdmin={isAdminOrMod}
                    />
                    {!(proposal instanceof Thread) && (
                      <LinkedProposalsEmbed proposal={proposal} />
                    )}
                    {proposal instanceof AaveProposal && (
                      <AaveViewProposalDetail proposal={proposal} />
                    )}
                    {!(proposal instanceof Thread) && (
                      <VotingResults proposal={proposal} />
                    )}
                    {!(proposal instanceof Thread) && (
                      <VotingActions proposal={proposal} />
                    )}
                    <ProposalComments
                      proposal={proposal}
                      comments={comments}
                      createdCommentCallback={createdCommentCallback}
                      getSetGlobalEditingStatus={getSetGlobalEditingStatus}
                      proposalPageState={this}
                      recentlySubmitted={this.recentlySubmitted}
                      isAdmin={isAdminOrMod}
                    />
                    {!this.editing && !this.parentCommentId && (
                      <CreateComment
                        callback={createdCommentCallback}
                        cancellable
                        getSetGlobalEditingStatus={getSetGlobalEditingStatus}
                        proposalPageState={this}
                        parentComment={null}
                        rootProposal={proposal}
                      />
                    )}
                  </div>
                </>
              )}
              {this.tabSelected === 'viewSidebar' && (
                <div class="view-sidebar-content-container">
                  {showLinkedSnapshotOptions && proposal instanceof Thread && (
                    <LinkedProposalsCard
                      onChangeHandler={(
                        stage: ThreadStage,
                        chainEntities: ChainEntity[],
                        snapshotProposal: SnapshotProposal[]
                      ) => {
                        proposal.stage = stage;
                        proposal.chainEntities = chainEntities;
                        if (app.chain?.meta.snapshot) {
                          proposal.snapshotProposal = snapshotProposal[0]?.id;
                        }
                        app.threads.fetchThreadsFromId([proposal.identifier]);
                        m.redraw();
                      }}
                      proposal={proposal}
                      showAddProposalButton={isAuthor || isAdminOrMod}
                    />
                  )}
                  {showLinkedThreadOptions && proposal instanceof Thread && (
                    <LinkedThreadsCard
                      proposalId={proposal.id}
                      allowLinking={isAuthor || isAdminOrMod}
                    />
                  )}
                  {proposal instanceof Thread &&
                    [
                      ...new Map(
                        this.polls?.map((poll) => [poll.id, poll])
                      ).values(),
                    ].map((poll: Poll) => {
                      return (
                        <PollCard
                          multiSelect={false}
                          pollEnded={
                            poll.endsAt && poll.endsAt?.isBefore(moment().utc())
                          }
                          hasVoted={
                            app.user.activeAccount &&
                            poll.getUserVote(
                              app.user.activeAccount?.chain?.id,
                              app.user.activeAccount?.address
                            )
                          }
                          disableVoteButton={!app.user.activeAccount}
                          votedFor={
                            poll.getUserVote(
                              app.user.activeAccount?.chain?.id,
                              app.user.activeAccount?.address
                            )?.option
                          }
                          proposalTitle={poll.prompt}
                          timeRemaining={getProposalPollTimestamp(
                            poll,
                            poll.endsAt && poll.endsAt?.isBefore(moment().utc())
                          )}
                          totalVoteCount={poll.votes?.length}
                          voteInformation={poll.options.map((option) => {
                            return {
                              label: option,
                              value: option,
                              voteCount: poll.votes.filter(
                                (v) => v.option === option
                              ).length,
                            };
                          })}
                          incrementalVoteCast={1}
                          isPreview={false}
                          tooltipErrorMessage={
                            app.user.activeAccount
                              ? null
                              : 'You must join this community to vote.'
                          }
                          onVoteCast={(option, isSelected, callback) =>
                            handleProposalPollVote(
                              poll,
                              option,
                              isSelected,
                              callback
                            )
                          }
                          onResultsClick={(e) => {
                            e.preventDefault();
                            if (poll.votes.length > 0) {
                              app.modals.create({
                                modal: OffchainVotingModal,
                                data: { votes: poll.votes },
                              });
                            }
                          }}
                        />
                      );
                    })}
                  {proposal instanceof Thread &&
                    isAuthor &&
                    (!app.chain?.meta?.adminOnlyPolling || isAdmin) && (
                      <PollEditorCard
                        proposal={proposal}
                        proposalAlreadyHasPolling={!this.polls?.length}
                      />
                    )}
                </div>
              )}
            </div>
          )}
          <div
            class={getClasses<{ hasSidebar?: boolean }>(
              { hasSidebar: sidebarCheck },
              'view-proposal-body'
            )}
          >
            <div class="view-proposal-content-container">
              <ProposalHeader
                proposal={proposal}
                commentCount={commentCount}
                viewCount={viewCount}
                getSetGlobalEditingStatus={getSetGlobalEditingStatus}
                proposalPageState={this}
                isAuthor={isAuthor}
                isEditor={isEditor}
                isAdmin={isAdminOrMod}
              />
              {!(proposal instanceof Thread) && (
                <LinkedProposalsEmbed proposal={proposal} />
              )}
              {proposal instanceof AaveProposal && (
                <AaveViewProposalDetail proposal={proposal} />
              )}
              {!(proposal instanceof Thread) && (
                <VotingResults proposal={proposal} />
              )}
              {!(proposal instanceof Thread) && (
                <VotingActions proposal={proposal} />
              )}
              <ProposalComments
                proposal={proposal}
                comments={comments}
                createdCommentCallback={createdCommentCallback}
                getSetGlobalEditingStatus={getSetGlobalEditingStatus}
                proposalPageState={this}
                recentlySubmitted={this.recentlySubmitted}
                isAdmin={isAdminOrMod}
              />
              {!this.editing && !this.parentCommentId && (
                <CreateComment
                  callback={createdCommentCallback}
                  cancellable
                  getSetGlobalEditingStatus={getSetGlobalEditingStatus}
                  proposalPageState={this}
                  parentComment={null}
                  rootProposal={proposal}
                />
              )}
            </div>
            <div class="view-sidebar-content-container">
              {showLinkedSnapshotOptions && proposal instanceof Thread && (
                <LinkedProposalsCard
                  onChangeHandler={(
                    stage: ThreadStage,
                    chainEntities: ChainEntity[],
                    snapshotProposal: SnapshotProposal[]
                  ) => {
                    proposal.stage = stage;
                    proposal.chainEntities = chainEntities;
                    if (app.chain?.meta.snapshot) {
                      proposal.snapshotProposal = snapshotProposal[0]?.id;
                    }
                    app.threads.fetchThreadsFromId([proposal.identifier]);
                    m.redraw();
                  }}
                  proposal={proposal}
                  showAddProposalButton={isAuthor || isAdminOrMod}
                />
              )}
              {showLinkedThreadOptions && proposal instanceof Thread && (
                <LinkedThreadsCard
                  proposalId={proposal.id}
                  allowLinking={isAuthor || isAdminOrMod}
                />
              )}
              {proposal instanceof Thread &&
                [
                  ...new Map(
                    this.polls?.map((poll) => [poll.id, poll])
                  ).values(),
                ].map((poll: Poll) => {
                  return (
                    <PollCard
                      multiSelect={false}
                      pollEnded={
                        poll.endsAt && poll.endsAt?.isBefore(moment().utc())
                      }
                      hasVoted={
                        app.user.activeAccount &&
                        poll.getUserVote(
                          app.user.activeAccount?.chain?.id,
                          app.user.activeAccount?.address
                        )
                      }
                      disableVoteButton={!app.user.activeAccount}
                      votedFor={
                        poll.getUserVote(
                          app.user.activeAccount?.chain?.id,
                          app.user.activeAccount?.address
                        )?.option
                      }
                      proposalTitle={poll.prompt}
                      timeRemaining={getProposalPollTimestamp(
                        poll,
                        poll.endsAt && poll.endsAt?.isBefore(moment().utc())
                      )}
                      totalVoteCount={poll.votes?.length}
                      voteInformation={poll.options.map((option) => {
                        return {
                          label: option,
                          value: option,
                          voteCount: poll.votes.filter(
                            (v) => v.option === option
                          ).length,
                        };
                      })}
                      incrementalVoteCast={1}
                      tooltipErrorMessage={
                        app.user.activeAccount
                          ? null
                          : 'You must join this community to vote.'
                      }
                      onVoteCast={(option, isSelected, callback) =>
                        handleProposalPollVote(
                          poll,
                          option,
                          isSelected,
                          callback
                        )
                      }
                      onResultsClick={(e) => {
                        e.preventDefault();
                        if (poll.votes.length > 0) {
                          app.modals.create({
                            modal: OffchainVotingModal,
                            data: { votes: poll.votes },
                          });
                        }
                      }}
                    />
                  );
                })}
              {proposal instanceof Thread &&
                isAuthor &&
                (!app.chain?.meta?.adminOnlyPolling || isAdmin) && (
                  <PollEditorCard
                    proposal={proposal}
                    proposalAlreadyHasPolling={!this.polls?.length}
                  />
                )}
            </div>
          </div>
        </div>
      </Sublayout>
    );
  }
}

export default ViewProposalPage;
