/* eslint-disable no-unused-expressions */
import 'pages/discussions/index.scss';

import $ from 'jquery';
import _ from 'lodash';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import moment from 'moment-twitter';
import { Spinner } from 'construct-ui';

import app from 'state';
import { pluralize } from 'helpers';
import { OffchainThreadKind, NodeInfo, CommunityInfo } from 'models';

import { updateLastVisited } from 'controllers/app/login';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import EmptyTopicPlaceholder from 'views/components/empty_topic_placeholder';
import ProposalsLoadingRow from 'views/components/proposals_loading_row';
import DiscussionRow from 'views/pages/discussions/discussion_row';

import { updateRoute } from 'app';
import WeeklyDiscussionListing, { getLastUpdate } from './weekly_listing';
import Listing from '../listing';
import PinnedListing from './pinned_listing';

interface IDiscussionPageState {
  lookback?: number;
  postsDepleted?: boolean;
  lastVisitedUpdated?: boolean;
  hasOlderPosts?: boolean;
  defaultLookback: number;
}

const DiscussionsPage: m.Component<{ topic?: string }, IDiscussionPageState> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', {
      'Page Name': 'DiscussionsPage',
      Scope: app.activeId(),
    });

    const returningFromThread = (app.lastNavigatedBack() && app.lastNavigatedFrom().includes('/proposal/discussion/'));
    if (returningFromThread && localStorage[`${app.activeId()}-scrollY`]) {
      setTimeout(() => {
        window.scrollTo(0, Number(localStorage[`${app.activeId()}-scrollY`]));
      }, 1);
    }

    // Infinite Scroll
    const onscroll = _.debounce(() => {
      const scrollHeight = $(document).height();
      const scrollPos = $(window).height() + $(window).scrollTop();
      if (scrollPos > (scrollHeight - 400)) {
        if (vnode.state.hasOlderPosts && !vnode.state.postsDepleted) {
          vnode.state.lookback += vnode.state.defaultLookback;
          m.redraw();
        }
      }
    }, 400);
    $(window).on('scroll', onscroll);
  },
  view: (vnode) => {
    if (!app.activeId()) return;

    // determine lookback length
    vnode.state.defaultLookback = 20;

    const returningFromThread = (app.lastNavigatedBack() && app.lastNavigatedFrom().includes('/proposal/discussion/'));
    vnode.state.lookback = (returningFromThread && localStorage[`${app.activeId()}-lookback`])
      ? Number(localStorage[`${app.activeId()}-lookback`])
      : Number.isInteger(vnode.state.lookback)
        ? vnode.state.lookback
        : vnode.state.defaultLookback;

    localStorage[`${app.activeId()}-lookback`] = vnode.state.lookback;

    const { topic } = vnode.attrs;
    const activeEntity = app.community ? app.community : app.chain;
    // add chain compatibility (node info?)
    if (!activeEntity?.serverLoaded) return m(PageLoading, { title: topic || 'Discussions' });

    const activeAddressInfo = app.user.activeAccount && app.user.addresses
      .find((a) => a.address === app.user.activeAccount.address && a.chain === app.user.activeAccount.chain?.id);

    const activeNode = app.chain?.meta;
    const selectedNodes = app.config.nodes.getAll().filter((n) => activeNode && n.url === activeNode.url
                                       && n.chain && activeNode.chain && n.chain.id === activeNode.chain.id);
    const selectedNode = selectedNodes.length > 0 && selectedNodes[0];
    const selectedCommunity = app.community;

    const communityName = selectedNode
      ? selectedNode.chain.name : selectedCommunity ? selectedCommunity.meta.name : '';
    const communityDescription = selectedNode
      ? selectedNode.chain.description : selectedCommunity ? selectedCommunity.meta.description : '';

    const allLastVisited = (typeof app.user.lastVisited === 'string')
      ? JSON.parse(app.user.lastVisited)
      : app.user.lastVisited;
    if (!vnode.state.lastVisitedUpdated) {
      vnode.state.lastVisitedUpdated = true;
      updateLastVisited(app.community
        ? (activeEntity.meta as CommunityInfo)
        : (activeEntity.meta as NodeInfo).chain);
    }

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

    const getSingleTopicListing = (topic_) => {
      if (!activeEntity || !activeEntity.serverLoaded) {
        return m('.discussions-main', [
          m(ProposalsLoadingRow),
        ]);
      }

      const id = (activeEntity.meta as NodeInfo).chain
        ? (activeEntity.meta as NodeInfo).chain.id
        : (activeEntity.meta as CommunityInfo).id;
      const lastVisited = moment(allLastVisited[id]).utc();
      let visitMarkerPlaced = false;
      let list = [];
      const divider = m('.LastSeenDivider', [ m('hr'), m('span', 'Last Visited'), m('hr') ]);
      const sortedThreads = app.threads.getType(OffchainThreadKind.Forum, OffchainThreadKind.Link)
        .filter((thread) => thread.topic && thread.topic.name === topic_ && !thread.pinned)
        .sort(orderDiscussionsbyLastComment);

      const pinnedThreads = app.threads.getType(OffchainThreadKind.Forum, OffchainThreadKind.Link)
        .filter((thread) => thread.topic && thread.topic.name === topic_ && thread.pinned)
        .sort(orderByDateReverseChronological);
      if (pinnedThreads.length > 0) {
        list.push(m(PinnedListing, { proposals: pinnedThreads }));
      }

      if (sortedThreads.length > 0) {
        const firstThread = sortedThreads[0];
        const lastThread = sortedThreads[sortedThreads.length - 1];
        const allThreadsSeen = () => getLastUpdate(firstThread) < lastVisited;
        const noThreadsSeen = () => getLastUpdate(lastThread) > lastVisited;

        if (noThreadsSeen() || allThreadsSeen()) {
          list.push(m('.discussion-group-wrap', sortedThreads.map((proposal) => m(DiscussionRow, { proposal }))));
        } else {
          sortedThreads.forEach((proposal) => {
            const row = m(DiscussionRow, { proposal });
            if (!visitMarkerPlaced && getLastUpdate(proposal) < lastVisited) {
              list = [m('.discussion-group-wrap', list), divider, m('.discussion-group-wrap', [row])];
              visitMarkerPlaced = true;
            } else {
              // eslint-disable-next-line no-unused-expressions
              visitMarkerPlaced ? list[2].children.push(row) : list.push(row);
            }
          });
        }

        if (list.length > 0) {
          return m('.discussions-main', [
            m(Listing, {
              content: list,
              rightColSpacing: [4, 4, 4],
              columnHeaders: [
                'Title',
                'Replies',
                'Likes',
                'Last updated'
              ],
              menuCarat: true,
            })
          ]);
        }
      }

      return m('.discussions-main', [
        m(EmptyTopicPlaceholder, { topicName: topic }),
      ]);
    };

    const getHomepageListing = () => {
      // get proposals, grouped by week
      const allThreads = app.threads
        .getType(OffchainThreadKind.Forum, OffchainThreadKind.Link)
        .sort(orderDiscussionsbyLastComment);

      // select the appropriate lastVisited timestamp from the chain||community & convert to Moment
      // for easy comparison with weekly indexes' msecAgo
      const now = +moment().utc();
      const id = (activeEntity.meta as NodeInfo).chain
        ? (activeEntity.meta as NodeInfo).chain.id
        : (activeEntity.meta as CommunityInfo).id;
      const lastVisited = moment(allLastVisited[id]).utc();
      const lastVisitedAgo = now - lastVisited;

      const listing = [];
      let count = 0;
      let visitMarkerPlaced = false;
      const discussionRow = (proposal) => m(DiscussionRow, { proposal });
      const LastSeenDivider = m('.LastSeenDivider', [ m('hr'), m('span', 'New posts'), m('hr') ]);
      // pinned threads are inserted at the top of the listing
      const pinnedThreads = allThreads.filter((t) => t.pinned);
      if (pinnedThreads.length > 0) {
        listing.push(m(PinnedListing, { proposals: pinnedThreads }));
      }
      // TODO: Ensure proper counting with and without pins
      const otherThreads = allThreads.filter((t) => !t.pinned);
      if (otherThreads.length < vnode.state.lookback) {
        vnode.state.postsDepleted = true;
        vnode.state.lookback = otherThreads.length;
      }
      while (count < vnode.state.lookback) {
        const thread = otherThreads[count];
        if (lastVisited < getLastUpdate(thread) && !visitMarkerPlaced) {
          listing.push(LastSeenDivider);
          visitMarkerPlaced = true;
        }
        listing.push(otherThreads[count]);
        count += 1;
      }

      return m('.discussions-main', [
        // m(InlineThreadComposer),
        listing.length === 0
          ? m(EmptyTopicPlaceholder, { communityName })
          : m(Listing, {
            content: listing,
            rightColSpacing: [4, 4, 4],
            columnHeaders: [
              'Title',
              'Replies',
              'Likes',
              'Last updated'
            ],
            menuCarat: true,
          }),
        // TODO: Incorporate infinite scroll into generic Listing component
        listing.length && vnode.state.postsDepleted
          ? m('.infinite-scroll-reached-end', [
            `Showing all ${listing.length} of ${pluralize(listing.length, 'posts')}`
          ])
          : listing.length
            ? m('.infinite-scroll-spinner-wrap', [
              m(Spinner, { active: !vnode.state.postsDepleted })
            ])
            : null
      ]);
    };

    let topicDescription;
    if (topic && app.activeId()) {
      const topics = app.topics.getByCommunity(app.activeId());
      const topicObject = topics.find((t) => t.name === topic);
      topicDescription = topicObject?.description;
    }

    return m(Sublayout, {
      class: 'DiscussionsPage',
      title: topic || 'Discussions',
      description: topicDescription,
      showNewProposalButton: true,
    }, [
      (app.chain || app.community) && [
        topic
          ? getSingleTopicListing(topic)
          : getHomepageListing(),
      ]
    ]);
  },
};

export default DiscussionsPage;
