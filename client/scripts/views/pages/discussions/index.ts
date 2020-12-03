import 'pages/discussions/index.scss';

import $ from 'jquery';
import _ from 'lodash';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import moment from 'moment-twitter';
import app from 'state';

import { Spinner } from 'construct-ui';
import { pluralize } from 'helpers';
import { OffchainThreadKind, NodeInfo, CommunityInfo } from 'models';

import { updateLastVisited } from 'controllers/app/login';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import EmptyTopicPlaceholder from 'views/components/empty_topic_placeholder';
import ProposalsLoadingRow from 'views/components/proposals_loading_row';
import Listing from 'views/pages/listing';

import { DEFAULT_PAGE_SIZE } from 'controllers/server/threads';
import { ListingSidebar } from './sidebar';
import PinnedListing from './pinned_listing';
import DiscussionRow from './discussion_row';

export const ALL_PROPOSALS_KEY = 'COMMONWEALTH_ALL_PROPOSALS';

interface IDiscussionPageState {
  lookback?: { [community: string]: moment.Moment} ;
  postsDepleted: { [community: string]: boolean };
  topicInitialized: { [community: string]: boolean };
  lastSubpage: string;
  lastVisitedUpdated?: boolean;
  onscroll: any;
}

const getLastUpdate = (proposal) => {
  const lastComment = Number(app.comments.lastCommented(proposal));
  const createdAt = Number(proposal.createdAt.utc());
  const lastUpdate = Math.max(createdAt, lastComment);
  return lastUpdate;
};

const getLastSeenDivider = (hasText = true) => {
  return m('.LastSeenDivider', hasText ? [
    m('hr'),
    m('span', 'Last visit'),
    m('hr'),
  ] : [
    m('hr'),
  ]);
};

const DiscussionsPage: m.Component<{ topic?: string }, IDiscussionPageState> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', {
      'Page Name': 'DiscussionsPage',
      Scope: app.activeId(),
    });

    const returningFromThread = (app.lastNavigatedBack() && app.lastNavigatedFrom().includes('/proposal/discussion/'));
    if (returningFromThread && localStorage[`${app.activeId()}-discussions-scrollY`]) {
      setTimeout(() => {
        window.scrollTo(0, Number(localStorage[`${app.activeId()}-discussions-scrollY`]));
      }, 1);
    }

    if (app.user.unseenPosts[app.activeId()]) {
      app.user.unseenPosts[app.activeId()]['activePosts'] = 0;
      app.user.unseenPosts[app.activeId()]['threads'] = 0;
    }
  },
  oninit: (vnode) => {
    vnode.state.lookback = {};
    vnode.state.postsDepleted = {};
    vnode.state.topicInitialized = {};
    vnode.state.topicInitialized[ALL_PROPOSALS_KEY] = true;
    const subpage = vnode.attrs.topic || ALL_PROPOSALS_KEY;
    const returningFromThread = (app.lastNavigatedBack() && app.lastNavigatedFrom().includes('/proposal/discussion/'));
    vnode.state.lookback[subpage] = (returningFromThread && localStorage[`${app.activeId()}-lookback-${subpage}`])
      ? localStorage[`${app.activeId()}-lookback-${subpage}`]
      : vnode.state.lookback[subpage]?._isAMomentObject
        ? vnode.state.lookback[subpage]
        : moment();
  },
  view: (vnode) => {
    const { topic } = vnode.attrs;
    const activeEntity = app.community ? app.community : app.chain;
    if (!activeEntity) return m(PageLoading, {
      title: topic || 'Discussions',
      showNewProposalButton: true,
    });
    const subpage = topic || ALL_PROPOSALS_KEY;

    // add chain compatibility (node info?)
    if (!activeEntity?.serverLoaded) return m(PageLoading, {
      title: topic || 'Discussions',
      showNewProposalButton: true,
    });

    const activeNode = app.chain?.meta;
    const selectedNodes = app.config.nodes.getAll().filter((n) => activeNode && n.url === activeNode.url
                                       && n.chain && activeNode.chain && n.chain.id === activeNode.chain.id);
    const selectedNode = selectedNodes.length > 0 && selectedNodes[0];
    const selectedCommunity = app.community;

    const communityName = selectedNode
      ? selectedNode.chain.name : selectedCommunity ? selectedCommunity.meta.name : '';

    const allLastVisited = (typeof app.user.lastVisited === 'string')
      ? JSON.parse(app.user.lastVisited)
      : app.user.lastVisited;
    if (!vnode.state.lastVisitedUpdated) {
      vnode.state.lastVisitedUpdated = true;
      updateLastVisited(app.community
        ? (activeEntity.meta as CommunityInfo)
        : (activeEntity.meta as NodeInfo).chain);
    }

    // select the appropriate lastVisited timestamp from the chain||community & convert to Moment
    // for easy comparison with weekly indexes' msecAgo
    const id = (activeEntity.meta as NodeInfo).chain
      ? (activeEntity.meta as NodeInfo).chain.id
      : (activeEntity.meta as CommunityInfo).id;
    const lastVisited = moment(allLastVisited[id]).utc();

    // comparator
    const orderDiscussionsbyLastComment = (a, b) => {
      // tslint:disable-next-line
      const tsB = Math.max(+b.createdAt, +(app.comments.lastCommented(b) || 0));
      const tsA = Math.max(+a.createdAt, +(app.comments.lastCommented(a) || 0));
      return tsB - tsA;
    };

    const orderByDateReverseChronological = (a, b) => {
      // tslint:disable-next-line
      const tsB = Math.max(+b.createdAt);
      const tsA = Math.max(+a.createdAt);
      return tsA - tsB;
    };

    let listing = [];
    const allThreads = app.threads.listingStore
      .getByCommunityAndTopic(app.activeId(), subpage)
      .sort(orderDiscussionsbyLastComment);

    if (allThreads.length > 0) {
      // pinned threads - inserted at the top of the listing
      const pinnedThreads = allThreads.filter((t) => t.pinned);
      if (pinnedThreads.length > 0) {
        listing.push(m(PinnedListing, { proposals: pinnedThreads }));
      }
    }

    const sortedThreads = allThreads.filter((t) => !t.pinned);

    const firstThread = sortedThreads[0];
    const lastThread = sortedThreads[sortedThreads.length - 1];

    if (sortedThreads.length > 0) {
      let visitMarkerPlaced = false;
      vnode.state.lookback[subpage] = moment(getLastUpdate(sortedThreads[sortedThreads.length - 1]));

      if (allThreads.length > sortedThreads.length) {
        if (firstThread && getLastUpdate(firstThread) > lastVisited) {
          listing.push(getLastSeenDivider(false));
        }
      }

      const allThreadsSeen = () => firstThread && getLastUpdate(firstThread) < lastVisited;
      const noThreadsSeen = () => lastThread && getLastUpdate(lastThread) > lastVisited;

      if (noThreadsSeen() || allThreadsSeen()) {
        listing.push(m('.discussion-group-wrap', sortedThreads
          .map((proposal) => m(DiscussionRow, { proposal }))));
      } else {
        let count = 0;
        sortedThreads.forEach((proposal) => {
          const row = m(DiscussionRow, { proposal });
          if (!visitMarkerPlaced && getLastUpdate(proposal) < lastVisited) {
            listing = [m('.discussion-group-wrap', listing), getLastSeenDivider(), m('.discussion-group-wrap', [row])];
            visitMarkerPlaced = true;
            count += 1;
          } else {
            if (visitMarkerPlaced) {
              listing[2].children.push(row);
            } else {
              listing.push(row);
            }
            count += 1;
          }
        });
      }
    }

    const newSubpage = subpage !== vnode.state.lastSubpage;

    if (newSubpage) {
      $(window).off('scroll');

      let topicId;
      if (topic) {
        topicId = app.topics.getByName(topic, app.activeId())?.id;
        if (!topicId) {
          return m(EmptyTopicPlaceholder, {
            communityName: app.activeId(),
            topicName: topic
          });
        }
      }

      if (!vnode.state.lookback[subpage]
        || !vnode.state.lookback[subpage]?._isAMomentObject) {
        vnode.state.lookback[subpage] = moment();
      }

      // cutoffDate is the furthest date, back in the forum history, that has been fetched
      // and stored for a given community subpage. It is used in the loadNextPage threads ctrlr
      // function as the query cutoff, fetching only threads older than it.
      const options = {
        chainId: app.activeChainId(),
        communityId: app.activeCommunityId(),
        cutoffDate: vnode.state.lookback[subpage],
        topicId,
      };

      if (!vnode.state.topicInitialized[subpage]) {
        // Fetch first page of posts
        app.threads.loadNextPage(options).then((morePostsRemaining) => {
          if (!morePostsRemaining) vnode.state.postsDepleted[subpage] = true;
          m.redraw();
        });
        vnode.state.topicInitialized[subpage] = true;
      } else if (allThreads.length < DEFAULT_PAGE_SIZE && subpage === ALL_PROPOSALS_KEY) {
        vnode.state.postsDepleted[subpage] = true;
      }

      // Initialize infiniteScroll
      vnode.state.onscroll = _.debounce(async () => {
        if (vnode.state.postsDepleted[subpage]) return;
        const scrollHeight = $(document).height();
        const scrollPos = $(window).height() + $(window).scrollTop();
        if (scrollPos > (scrollHeight - 400)) {
          options.cutoffDate = vnode.state.lookback[subpage];
          const morePostsRemaining = await app.threads.loadNextPage(options);
          if (!morePostsRemaining) vnode.state.postsDepleted[subpage] = true;
          m.redraw();
        }
      }, 400);

      // Trigger a scroll event after this render cycle
      // NOTE: If the window is resized to increase its height, we may
      // get stuck in a state where the user cannot scroll and thus
      // new posts can never be loaded.
      setTimeout(() => {
        if ($('.DiscussionsPage').height() < $(document).height()) {
          $(window).trigger('scroll');
        }
      }, 0);

      $(window).on('scroll', vnode.state.onscroll);

      vnode.state.lastSubpage = subpage;
    }

    let topicDescription;
    if (topic && app.activeId()) {
      const topics = app.topics.getByCommunity(app.activeId());
      const topicObject = topics.find((t) => t.name === topic);
      topicDescription = topicObject?.description;
    }

    localStorage.setItem(`${app.activeId()}-lookback-${subpage}`, vnode.state.lookback[subpage]);
    const stillFetching = (allThreads.length === 0 && vnode.state.postsDepleted[subpage] === false);
    const emptyTopic = (allThreads.length === 0 && vnode.state.postsDepleted[subpage] === true);
    return m(Sublayout, {
      class: 'DiscussionsPage',
      title: topic || 'Discussions',
      description: topicDescription,
      showNewProposalButton: true,
      rightSidebar: m(ListingSidebar, { entity: app.activeId() })
    }, [
      (app.chain || app.community) && [
        m('.discussions-main', [
          // m(InlineThreadComposer),
          (!activeEntity || !activeEntity.serverLoaded || stillFetching)
            ? m('.discussions-main', [
              m(ProposalsLoadingRow),
            ])
            : emptyTopic
              // TODO: Ensure that this doesn't get shown on first render
              ? m(EmptyTopicPlaceholder, { communityName, topicName: topic })
              : m(Listing, {
                content: listing,
                rightColSpacing: [4, 4, 4],
                columnHeaders: [
                  'Title',
                  'Comments',
                  'Likes',
                  'Updated'
                ],
                menuCarat: true,
              }),
          // TODO: Incorporate infinite scroll into generic Listing component
          (allThreads.length && vnode.state.postsDepleted[subpage])
            ? m('.infinite-scroll-reached-end', [
              `Showing ${allThreads.length} of ${pluralize(allThreads.length, 'thread')}`,
              (topic ? ` under the topic '${topic}'` : '')
            ])
            : (allThreads.length)
              ? m('.infinite-scroll-spinner-wrap', [
                m(Spinner, { active: !vnode.state.postsDepleted[subpage] })
              ])
              : null
        ])
      ]
    ]);
  }
};

export default DiscussionsPage;
