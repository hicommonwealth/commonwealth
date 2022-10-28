/* @jsx m */

import $ from 'jquery';
import m from 'mithril';

import 'pages/view_proposal/index.scss';

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
import Substrate from 'controllers/chain/substrate/adapter';
import { notifyError } from 'controllers/app/notifications';
import {
  Comment,
  Poll,
  Thread,
  Account,
  ProposalModule,
  AnyProposal,
} from 'models';
import { PageLoading } from 'views/pages/loading';
import { PageNotFound } from 'views/pages/404';
import { SubstrateTreasuryTip } from 'controllers/chain/substrate/treasury_tip';
import { modelFromServer as modelReactionCountFromServer } from 'controllers/server/reactionCounts';
import { activeQuillEditorHasText } from './helpers';
import { CWTabBar, CWTab } from '../../components/component_kit/cw_tabs';
import {
  getClasses,
  isWindowMediumSmallInclusive,
} from '../../components/component_kit/helpers';
import { Prefetch } from './types';
import { TipDetail } from '../tip_detail';
import { ProposalBody } from './proposal_body';
import { ThreadSidebar } from '../view_thread/thread_sidebar';

class ViewProposalPage
  implements
    m.ClassComponent<{
      identifier: string;
      type?: string;
    }>
{
  private comments: Comment<Thread>[];
  private isGloballyEditing: boolean;
  private polls: Poll[];
  private prefetch: Prefetch;
  private proposal: AnyProposal | Thread;
  private recentlyEdited: boolean;
  private tabSelected: 'viewProposal' | 'viewSidebar';
  private threadFetched: boolean;
  private threadFetchFailed: boolean;
  private tipAmount: number;
  private viewCount: number;

  oninit() {
    this.tabSelected = 'viewProposal';
  }

  view(vnode) {
    const { identifier } = vnode.attrs;

    const isDiscussion = pathIsDiscussion(app.activeChainId(), m.route.get());

    if (!app.chain?.meta && !isDiscussion) {
      return (
        <PageLoading
        // title="Loading..."
        />
      );
    }

    const type =
      vnode.attrs.type ||
      (isDiscussion
        ? ProposalType.Thread
        : chainToProposalSlug(app.chain.meta));

    const headerTitle = isDiscussion ? 'Discussions' : 'Proposals';

    if (typeof identifier !== 'string')
      return (
        <PageNotFound
        // title={headerTitle}
        />
      );

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
      return (
        <PageNotFound
        // title={headerTitle}
        />
      );
    }

    // load app controller
    if (!app.threads.initialized) {
      return (
        <PageLoading
        // title={headerTitle}
        />
      );
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
          return (
            <PageLoading
            //  title={headerTitle}
            />
          );
        } else {
          if (!app.chain.loaded) {
            return (
              <PageLoading
              //  title={headerTitle}
              />
            );
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
            return (
              <PageLoading
              // title={headerTitle}
              />
            );
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

    const updatedCommentsCallback = () => {
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
        object_id: proposal.id,
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
      return (
        <PageLoading
        //  title={headerTitle}
        />
      );
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
      return (
        <PageLoading
        //  title={headerTitle}
        />
      );
    }
    this.prefetch[proposalIdAndType]['profilesFinished'] = true;

    const windowListener = (e) => {
      if (this.isGloballyEditing || activeQuillEditorHasText()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', windowListener);

    const comments = this.comments;
    const viewCount: number = this.viewCount;
    const commentCount: number = app.comments.nComments(proposal);

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

    const isAdmin =
      app.roles.isRoleOfCommunity({
        role: 'admin',
        chain: app.activeChainId(),
      }) || app.user.isSiteAdmin;

    const isAdminOrMod =
      isAdmin ||
      app.roles.isRoleOfCommunity({
        role: 'moderator',
        chain: app.activeChainId(),
      });

    const setIsGloballyEditing = (status: boolean) => {
      this.isGloballyEditing = status;

      if (status === false) {
        this.recentlyEdited = true;
      }

      m.redraw();
    };

    if (proposal instanceof SubstrateTreasuryTip) {
      <TipDetail
        proposal={proposal}
        headerTitle={headerTitle}
        setTipAmount={(tip) => {
          this.tipAmount = tip;
        }}
      />;
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

    const hasSidebar =
      proposal instanceof Thread &&
      (showLinkedSnapshotOptions ||
        showLinkedThreadOptions ||
        this.polls?.length > 0 ||
        isAuthor);

    return (
      <Sublayout
      //  title={headerTitle}
      >
        <div class="ViewProposalPage">
          <div
            class={getClasses<{ hasSidebar?: boolean }>(
              { hasSidebar },
              'proposal-body-with-tabs'
            )}
          >
            <CWTabBar>
              <CWTab
                label={proposal instanceof Thread ? 'Thread' : 'Proposal'}
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
              <ProposalBody
                commentCount={commentCount}
                comments={comments}
                updatedCommentsCallback={updatedCommentsCallback}
                setIsGloballyEditing={setIsGloballyEditing}
                isAdminOrMod={isAdminOrMod}
                isAuthor={isAuthor}
                isEditor={isEditor}
                isGloballyEditing={this.isGloballyEditing}
                proposal={proposal}
                viewCount={viewCount}
              />
            )}
            {hasSidebar && this.tabSelected === 'viewSidebar' && (
              <ThreadSidebar
                isAdmin={isAdmin}
                isAdminOrMod={isAdminOrMod}
                isAuthor={isAuthor}
                polls={this.polls}
                thread={proposal}
                showLinkedSnapshotOptions={showLinkedSnapshotOptions}
                showLinkedThreadOptions={showLinkedThreadOptions}
              />
            )}
          </div>
          <div
            class={getClasses<{ hasSidebar?: boolean }>(
              { hasSidebar },
              'proposal-body'
            )}
          >
            <ProposalBody
              commentCount={commentCount}
              comments={comments}
              updatedCommentsCallback={updatedCommentsCallback}
              setIsGloballyEditing={setIsGloballyEditing}
              isAdminOrMod={isAdminOrMod}
              isAuthor={isAuthor}
              isEditor={isEditor}
              isGloballyEditing={this.isGloballyEditing}
              proposal={proposal}
              viewCount={viewCount}
            />
            {hasSidebar && (
              <ThreadSidebar
                isAdmin={isAdmin}
                isAdminOrMod={isAdminOrMod}
                isAuthor={isAuthor}
                polls={this.polls}
                thread={proposal}
                showLinkedSnapshotOptions={showLinkedSnapshotOptions}
                showLinkedThreadOptions={showLinkedThreadOptions}
              />
            )}
          </div>
        </div>
      </Sublayout>
    );
  }
}

export default ViewProposalPage;
