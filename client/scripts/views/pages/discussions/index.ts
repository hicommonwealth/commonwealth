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
import { OffchainThreadKind, NodeInfo, CommunityInfo, AddressInfo } from 'models';

import { updateLastVisited } from 'controllers/app/login';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import EmptyTopicPlaceholder from 'views/components/empty_topic_placeholder';
import ProposalsLoadingRow from 'views/components/proposals_loading_row';
import DiscussionRow from 'views/pages/discussions/discussion_row';

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
      list.push(m(PinnedListing, { proposals: pinnedThreads }));

      if (sortedThreads.length > 0 || pinnedThreads.length > 0) {
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
          return m(Listing, {
            content: list,
            rightColSpacing: [4, 4, 4],
            columnHeaders: [
              'Title',
              'Replies',
              'Likes',
              'Last updated'
            ],
            menuCarat: true,
          });
        }
      }

      return m('.discussions-main', [
        m(EmptyTopicPlaceholder, { topicName: topic }),
      ]);
    };

    const getHomepageListing = () => {
      // get proposals, grouped by week
      const allProposals = app.threads.getType(OffchainThreadKind.Forum, OffchainThreadKind.Link)
        .sort(orderDiscussionsbyLastComment);
      const now = +moment().utc();
      const week = moment.duration(1, 'week');

      // group proposals into an object with msecAgo as key and arr of OffchainThreads as val
      const proposalsByWeek = _.groupBy(allProposals, (proposal) => {
        const ago = now - +(app.comments.lastCommented(proposal) || proposal.createdAt).utc();
        return ago - (ago % week);
      });
      const weekIndexes = Object.keys(proposalsByWeek);
      vnode.state.hasOlderPosts = weekIndexes.findIndex((msecAgo) => +msecAgo > vnode.state.lookback) !== -1;

      // select the appropriate lastVisited timestamp from the chain||community & convert to Moment
      // for easy comparison with weekly indexes' msecAgo
      const id = (activeEntity.meta as NodeInfo).chain
        ? (activeEntity.meta as NodeInfo).chain.id
        : (activeEntity.meta as CommunityInfo).id;
      const lastVisited = moment(allLastVisited[id]).utc();
      const lastVisitedAgo = now - lastVisited;

      // locate the appropriate week in which to display a 'last visited' divider
      const targetIdx = Math.max(...weekIndexes
        .filter((idx) => Number(idx) < lastVisitedAgo)
        .map((str) => Number(str)));

      // determine lookback length
      vnode.state.defaultLookback = 20;
      const { defaultLookback } = vnode.state;
      vnode.state.lookback = (!vnode.state.lookback || isNaN(vnode.state.lookback))
        ? defaultLookback
        : vnode.state.lookback;

      let isFirstWeek = true;

      // render proposals by week
      const getRecentPostsSortedByWeek = () => {
        const arr = [];
        let count = 0;
        const pinnedThreads = allProposals.filter((t) => t.pinned);
        arr.push(m(PinnedListing, { proposals: pinnedThreads }));
        weekIndexes.sort((a, b) => Number(a) - Number(b)).forEach((msecAgo) => {
          let proposals;
          if (allProposals.length < vnode.state.lookback) {
            vnode.state.postsDepleted = true;
            vnode.state.lookback = allProposals.length;
          }
          if (count < vnode.state.lookback) {
            if (count + proposalsByWeek[msecAgo].length > vnode.state.lookback) {
              proposals = proposalsByWeek[msecAgo].slice(0, vnode.state.lookback - count);
            } else {
              proposals = proposalsByWeek[msecAgo];
            }
            count += proposals.length;
            const isCurrentWeek = +msecAgo === 0;
            const isLastWeek = +msecAgo === +week * 2;
            const attrs = {
              isCurrentWeek,
              isFirstWeek,
              heading: isCurrentWeek
                ? 'This week'
                : (isLastWeek
                  ? 'Last week'
                  : `Week ending ${moment(now - +msecAgo).format('MMM D, YYYY')}`),
              proposals
            };
            if (Number(msecAgo) === targetIdx) attrs['lastVisited'] = Number(lastVisited);
            arr.push(m(WeeklyDiscussionListing, attrs));
            isFirstWeek = false;
          } else {
            // Already showing up to vnode.state.lookback posts; don't need to load any more
            return null;
          }
        });
        return arr;
      };
      return m('.discussions-main', [
        // m(InlineThreadComposer),
        allProposals.length === 0
          ? m(EmptyTopicPlaceholder, { communityName })
          : m(Listing, {
            content: getRecentPostsSortedByWeek(),
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
        getRecentPostsSortedByWeek().length && vnode.state.postsDepleted
          ? m('.infinite-scroll-reached-end', [
            `Showing all ${allProposals.length} of ${pluralize(allProposals.length, 'posts')}`
          ])
          : getRecentPostsSortedByWeek().length
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
