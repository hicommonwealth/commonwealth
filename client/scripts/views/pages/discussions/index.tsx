/* @jsx m */

import $ from 'jquery';
import _ from 'lodash';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import moment from 'moment';
import { Spinner } from 'construct-ui';

import 'pages/discussions/index.scss';

import app from 'state';
import { pluralize } from 'helpers';
import { NodeInfo, OffchainThread } from 'models';
import { updateLastVisited } from 'controllers/app/login';
import { INITIAL_PAGE_SIZE } from 'controllers/server/threads';
import Sublayout from 'views/sublayout';
import { PageLoading } from 'views/pages/loading';
import EmptyListingPlaceholder from 'views/components/empty_topic_placeholder';
import LoadingRow from 'views/components/loading_row';
import Listing from 'views/pages/listing';
import { getLastUpdate, PinnedListing } from './pinned_listing';
import { DiscussionRow } from './discussion_row';
import { SummaryListing } from './summary_listing';
import {
  onFeaturedDiscussionPage,
  orderDiscussionsbyLastComment,
} from './helpers';
import { DiscussionFilterBar } from './discussion_filter_bar';

export const getLastSeenDivider = (hasText = true) => {
  return (
    <div class="LastSeenDivider">
      {hasText ? (
        <>
          <hr />
          <span>Last visit</span>
          <hr />
        </>
      ) : (
        <hr />
      )}
    </div>
  );
};

export const ALL_PROPOSALS_KEY = 'COMMONWEALTH_ALL_PROPOSALS';

type DiscussionsPageAttrs = { topic?: string };

class DiscussionsPage implements m.ClassComponent<DiscussionsPageAttrs> {
  private lookback?: { [community: string]: moment.Moment };
  private postsDepleted: { [community: string]: boolean };
  private topicInitialized: { [community: string]: boolean };
  private lastSubpage: string;
  private lastVisitedUpdated?: boolean;
  private onscroll: any;
  private summaryView: boolean;
  private summaryViewInitialized: boolean;
  private recentThreads: OffchainThread[];
  private loadingRecentThreads: boolean;
  private activityFetched: boolean;

  oncreate() {
    mixpanel.track('PageVisit', {
      'Page Name': 'DiscussionsPage',
      Scope: app.activeChainId(),
    });

    const returningFromThread =
      app.lastNavigatedBack() &&
      app.lastNavigatedFrom().includes('/discussion/');
    if (
      returningFromThread &&
      localStorage[`${app.activeChainId()}-discussions-scrollY`]
    ) {
      setTimeout(() => {
        window.scrollTo(
          0,
          Number(localStorage[`${app.activeChainId()}-discussions-scrollY`])
        );
      }, 100);
    }

    if (app.user.unseenPosts[app.activeChainId()]) {
      app.user.unseenPosts[app.activeChainId()]['activePosts'] = 0;
      app.user.unseenPosts[app.activeChainId()]['threads'] = 0;
    }
  }

  oninit(vnode) {
    this.lookback = {};
    this.postsDepleted = {};
    this.topicInitialized = {};
    this.topicInitialized[ALL_PROPOSALS_KEY] = false;
    const topic = vnode.attrs.topic;
    const stage = m.route.param('stage');
    const subpage =
      topic || stage ? `${topic || ''}#${stage || ''}` : ALL_PROPOSALS_KEY;
    const returningFromThread =
      app.lastNavigatedBack() &&
      app.lastNavigatedFrom().includes('/discussion/');
    this.lookback[subpage] =
      returningFromThread &&
      localStorage[`${app.activeChainId()}-lookback-${subpage}`]
        ? moment.unix(
            parseInt(
              localStorage[`${app.activeChainId()}-lookback-${subpage}`],
              10
            )
          )
        : moment.isMoment(this.lookback[subpage])
        ? this.lookback[subpage]
        : moment();
  }

  view(vnode) {
    let { topic } = vnode.attrs;

    if (!app.chain) return;
    if (!this.summaryViewInitialized) {
      if (app.chain?.meta?.chain?.defaultSummaryView) {
        this.summaryView = true;
      }
      if (app.lastNavigatedBack()) {
        if (localStorage.getItem('discussion-summary-toggle') === 'true') {
          this.summaryView = true;
        }
      } else {
        if (!this.summaryView) {
          localStorage.setItem('discussion-summary-toggle', 'false');
        }
      }
      this.summaryViewInitialized = true;
    }
    const { summaryView, recentThreads, lastSubpage } = this;
    const topicSelected = onFeaturedDiscussionPage(m.route.get(), topic);
    const onSummaryView = summaryView && !topicSelected;

    if (onSummaryView && !this.activityFetched && !this.loadingRecentThreads) {
      this.loadingRecentThreads = true;
      app.recentActivity
        .getRecentTopicActivity({
          chainId: app.activeChainId(),
        })
        .then((res) => {
          this.activityFetched = true;
          this.loadingRecentThreads = false;
          this.recentThreads = res;
          m.redraw();
        });
    }

    let stage = m.route.param('stage');
    const activeEntity = app.chain;
    if (!activeEntity)
      return m(PageLoading, {
        title: 'Discussions',
        showNewProposalButton: true,
      });

    if (onSummaryView) {
      // overwrite any topic- or stage-scoping in URL
      topic = null;
      stage = null;
    }
    const subpage =
      topic || stage ? `${topic || ''}#${stage || ''}` : ALL_PROPOSALS_KEY;

    const activeNode = app.chain?.meta;
    const selectedNodes = app.config.nodes
      .getAll()
      .filter(
        (n) =>
          activeNode &&
          n.url === activeNode.url &&
          n.chain &&
          activeNode.chain &&
          n.chain.id === activeNode.chain.id
      );
    const selectedNode = selectedNodes.length > 0 && selectedNodes[0];

    const communityName = selectedNode ? selectedNode.chain.name : '';

    const allLastVisited =
      typeof app.user.lastVisited === 'string'
        ? JSON.parse(app.user.lastVisited)
        : app.user.lastVisited;
    if (!this.lastVisitedUpdated) {
      this.lastVisitedUpdated = true;
      updateLastVisited((activeEntity.meta as NodeInfo).chain);
    }

    // select the appropriate lastVisited timestamp from the chain||community & convert to Moment
    // for easy comparison with weekly indexes' msecAgo
    const id = (activeEntity.meta as NodeInfo).chain.id;
    const lastVisited = moment(allLastVisited[id]).utc();

    let sortedListing = [];
    const pinnedListing = [];
    // fetch unique addresses count for pinned threads
    if (!app.threadUniqueAddressesCount.getInitializedPinned()) {
      app.threadUniqueAddressesCount.fetchThreadsUniqueAddresses({
        threads: app.threads.listingStore
          .getByCommunityTopicAndStage(app.activeChainId(), topic, stage)
          .filter((t) => t.pinned),
        chainId: app.activeChainId(),
        pinned: true,
      });
    }

    const allThreads = app.threads.listingStore
      .getByCommunityTopicAndStage(app.activeChainId(), topic, stage)
      .sort(orderDiscussionsbyLastComment);

    if (allThreads.length > 0) {
      // pinned threads - inserted at the top of the listing
      const pinnedThreads = allThreads.filter((t) => t.pinned);
      if (pinnedThreads.length > 0) {
        sortedListing.push(m(PinnedListing, { proposals: pinnedThreads }));
        pinnedListing.push(m(PinnedListing, { proposals: pinnedThreads }));
        pinnedListing.push(m('.PinnedDivider', m('hr')));
      }
    }

    const unpinnedThreads = allThreads.filter((t) => !t.pinned);

    const firstThread = unpinnedThreads[0];
    const lastThread = unpinnedThreads[unpinnedThreads.length - 1];

    if (unpinnedThreads.length > 0) {
      let visitMarkerPlaced = false;
      this.lookback[subpage] = moment.unix(
        getLastUpdate(unpinnedThreads[unpinnedThreads.length - 1])
      );

      if (allThreads.length > unpinnedThreads.length) {
        if (firstThread) {
          if (getLastUpdate(firstThread) > lastVisited.unix()) {
            sortedListing.push(getLastSeenDivider(false));
          } else {
            sortedListing.push(m('PinnedDivider', m('hr')));
          }
        }
      }

      const allThreadsSeen = () =>
        firstThread && getLastUpdate(firstThread) < lastVisited.unix();

      const noThreadsSeen = () =>
        lastThread && getLastUpdate(lastThread) > lastVisited.unix();

      if (noThreadsSeen() || allThreadsSeen()) {
        sortedListing.push(
          m(
            '.discussion-group-wrap',
            unpinnedThreads.map((proposal) => m(DiscussionRow, { proposal }))
          )
        );
      } else {
        unpinnedThreads.forEach((proposal) => {
          if (
            !visitMarkerPlaced &&
            getLastUpdate(proposal) < lastVisited.unix()
          ) {
            const sortedListingCopy = sortedListing;

            sortedListing = [
              m('.discussion-group-wrap', sortedListingCopy),
              getLastSeenDivider(),
              m('.discussion-group-wrap', [m(DiscussionRow, { proposal })]),
            ];

            visitMarkerPlaced = true;
          } else {
            if (visitMarkerPlaced) {
              sortedListing[2].children.push(m(DiscussionRow, { proposal }));
            } else {
              sortedListing.push(m(DiscussionRow, { proposal }));
            }
          }
        });
      }
    }

    // TODO: Refactor this logic in light of summary system
    const newSubpage = subpage !== lastSubpage;

    if (newSubpage) {
      let topicId;
      if (topic) {
        topicId = app.topics.getByName(topic, app.activeChainId())?.id;
        if (!topicId) {
          return (
            <Sublayout title="Discussions" showNewProposalButton={true}>
              {m(EmptyListingPlaceholder, {
                communityName: app.activeChainId(),
                topicName: topic,
              })}
            </Sublayout>
          );
        }
      }

      if (!moment.isMoment(this.lookback[subpage])) {
        this.lookback[subpage] = moment();
      }

      // cutoffDate is the furthest date, back in the forum history, that has been fetched
      // and stored for a given community subpage. It is used in the loadNextPage threads ctrlr
      // function as the query cutoff, fetching only threads older than it.
      const options = {
        chainId: app.activeChainId(),
        cutoffDate: this.lookback[subpage],
        topicId,
        stage,
      };

      this.onscroll = _.debounce(async () => {
        if (this.postsDepleted[subpage]) return;
        const scrollHeight = $(document).height();
        const scrollPos = $(window).height() + $(window).scrollTop();
        if (scrollPos > scrollHeight - 400) {
          options.cutoffDate = this.lookback[subpage];
          const morePostsRemaining = await app.threads.loadNextPage(options);
          if (!morePostsRemaining) this.postsDepleted[subpage] = true;
          m.redraw();
        }
      }, 400);

      if (!this.topicInitialized[subpage]) {
        // Fetch first page of posts
        app.threads.loadNextPage(options).then((morePostsRemaining) => {
          if (!morePostsRemaining) this.postsDepleted[subpage] = true;
          m.redraw();
        });
        this.topicInitialized[subpage] = true;
      } else if (
        allThreads.length < INITIAL_PAGE_SIZE &&
        subpage === ALL_PROPOSALS_KEY
      ) {
        this.postsDepleted[subpage] = true;
      }

      this.lastSubpage = subpage;
    }

    let topicName;
    let topicDescription;
    if (topic && app.activeChainId()) {
      const topics = app.topics.getByCommunity(app.activeChainId());
      const topicObject = topics.find((t) => t.name === topic);
      topicName = topicObject?.name;
      topicDescription = topicObject?.description;
    }

    localStorage.setItem(
      `${app.activeChainId()}-lookback-${subpage}`,
      `${this.lookback[subpage].unix()}`
    );
    const stillFetching =
      unpinnedThreads.length === 0 && !this.postsDepleted[subpage];
    const isLoading =
      this.loadingRecentThreads ||
      !activeEntity ||
      !activeEntity.serverLoaded ||
      stillFetching;
    const isEmpty =
      !isLoading &&
      allThreads.length === 0 &&
      this.postsDepleted[subpage] === true;
    const postsDepleted = allThreads.length > 0 && this.postsDepleted[subpage];

    return (
      <Sublayout
        title="Discussions"
        description={topicDescription}
        showNewProposalButton={true}
        onscroll={this.onscroll}
      >
        {app.chain && (
          <div class="DiscussionsPage">
            <DiscussionFilterBar
              topic={topicName}
              stage={stage}
              parentState={this}
              disabled={isLoading || stillFetching}
            />
            {onSummaryView
              ? isLoading
                ? m(LoadingRow)
                : m(Listing, {
                    content: [<SummaryListing recentThreads={recentThreads} />],
                  })
              : isLoading
              ? m(LoadingRow)
              : isEmpty
              ? m(EmptyListingPlaceholder, {
                  stageName: stage,
                  communityName,
                  topicName,
                })
              : m(Listing, { content: sortedListing })}
            {postsDepleted && !onSummaryView ? (
              <div class="infinite-scroll-reached-end">
                Showing {allThreads.length} of{' '}
                {pluralize(allThreads.length, 'thread')}
                {topic ? ` under the topic '${topic}'` : ''}
              </div>
            ) : isEmpty || onSummaryView ? null : (
              <div class="infinite-scroll-spinner-wrap">
                <Spinner active={!this.postsDepleted[subpage]} size="lg" />
              </div>
            )}
          </div>
        )}
      </Sublayout>
    );
  }
}

export default DiscussionsPage;
