/* eslint-disable no-unused-expressions */
import 'pages/discussions.scss';

import _ from 'lodash';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import moment from 'moment-twitter';
import $ from 'jquery';

import app from 'state';
import { updateRoute } from 'app';
import { link } from 'helpers';
import PageLoading from 'views/pages/loading';
import ListingPage from 'views/pages/_listing_page';
import ProposalsLoadingRow from 'views/components/proposals_loading_row';
import DiscussionRow from 'views/components/discussion_row';
import { OffchainThreadKind, NodeInfo, CommunityInfo } from 'models';
import MembershipButton from 'views/components/membership_button';
import { updateLastVisited } from '../../../controllers/app/login';
import InlineThreadComposer from '../../components/inline_thread_composer';
import WeeklyDiscussionListing, { getLastUpdate } from './weekly_listing';
import DiscussionsSubscriptionButton from './subscription_button';
import TagSelector from './tag_selector';
import ChainOrCommunityRoles from './roles';

// TODO: refactor all of the below into a controller.

interface IDiscussionPageAttrs {
  tag?: string;
}

interface IDiscussionPageState {
  lookback?: number;
  postsDepleted?: boolean;
  lastVisitedUpdated?: boolean;
  hasOlderPosts?: boolean;
  defaultLookback: number;
}

const DiscussionsPage: m.Component<IDiscussionPageAttrs, IDiscussionPageState> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', {
      'Page Name': 'DiscussionsPage',
      Scope: app.activeId(),
    });
    // Infinite Scroll
    $(window).on('scroll', () => {
      const scrollHeight = $(document).height();
      const scrollPos = $(window).height() + $(window).scrollTop();
      if (scrollPos > (scrollHeight - 400)) {
        if (vnode.state.hasOlderPosts && !vnode.state.postsDepleted) {
          vnode.state.lookback += vnode.state.defaultLookback;
          m.redraw();
        }
      }
    });
  },
  view: (vnode) => {
    const activeEntity = app.community ? app.community : app.chain;
    // add chain compatability (node info?)
    if (!activeEntity?.serverLoaded) return m(PageLoading);

    const allLastVisited = (typeof app.login.lastVisited === 'string')
      ? JSON.parse(app.login.lastVisited)
      : app.login.lastVisited;
    if (!vnode.state.lastVisitedUpdated) {
      vnode.state.lastVisitedUpdated = true;
      updateLastVisited(app.community
        ? (activeEntity.meta as CommunityInfo)
        : (activeEntity.meta as NodeInfo).chain);
    }

    const pinnedThreads = app.threads.getType(OffchainThreadKind.Forum, OffchainThreadKind.Link)
      .filter((proposal) => proposal.pinned)
      .map((proposal) => m(DiscussionRow, { proposal }));
    // comparator
    const orderDiscussionsbyLastComment = (a, b) => {
      // tslint:disable-next-line
      const tsB = Math.max(+b.createdAt, +(app.comments.lastCommented(b) || 0));
      const tsA = Math.max(+a.createdAt, +(app.comments.lastCommented(a) || 0));
      return tsB - tsA;
    };

    const getBackHomeButton = () => link('a.back-home', `/${app.activeId()}/`, m.trust('&lsaquo; Back home'));

    const getSingleTagListing = (tag) => {
      if (!activeEntity || !activeEntity.serverLoaded) {
        return m('.discussions-listing.tag-listing', [
          m('h4.tag-name', [
            tag,
            getBackHomeButton(),
          ]),
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
        .filter((thread) => thread.tags && thread.tags.filter((t) => t.name === tag).length > 0)
        .sort(orderDiscussionsbyLastComment);

      if (sortedThreads.length === 0) {
        return m('.discussions-listing.tag-listing.no-tags-found', [
          m('h4.tag-name', [
            `No threads contain the tag '${tag}.'`,
          ]),
          getBackHomeButton(),
        ]);
      }

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
      return m('.discussions-listing.tag-listing', [
        m('h4.tag-name', [
          tag.name,
          getBackHomeButton(),
        ]),
        list.length === 0
          ? m('.no-threads', 'No threads')
          : m('.tag-forum', list),
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
            const attrs = {
              isCurrentWeek,
              isFirstWeek,
              heading: isCurrentWeek
                ? 'This week'
                : `Week ending ${moment(now - +msecAgo).format('MMM D, YYYY')}`,
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
      return m('.discussions-listing', [
        m(InlineThreadComposer),
        allProposals.length === 0
        && [
          m('h4', 'This week'),
          m('.no-threads', 'No threads'),
        ],
        allProposals.length !== 0
        && getRecentPostsSortedByWeek()
      ]);
    };

    return m(ListingPage, {
      class: 'DiscussionsPage',
      title: 'Discussions',
      subtitle: 'Discuss proposals and improvements',
      content: m('.row', [
        m('.col-sm-8.col-md-9', [
          vnode.attrs.tag
            ? getSingleTagListing(vnode.attrs.tag)
            : getHomepageListing(),
        ]),
        m('.col-sm-4.col-md-3', [
          m('.discussions-description', [
            m('h4', 'About this community'),
            m('h2.community-name', [
              (app.chain && app.chain.meta && app.chain.meta.chain)
                ? app.chain.meta.chain.name
                : (!app.chain && app.community && app.community.meta)
                  ? app.community.meta.name
                  : 'Community',
            ]),
            !app.chain && app.community && app.community.meta.privacyEnabled && m('.community-privacy', [
              'Private community',
              m('span.icon-lock'),
              app.community.meta.invitesEnabled && m('span.icon-mail', {
                title: 'Members may invite new members'
              }),
            ]),
            !app.chain && app.community && !app.community.meta.privacyEnabled && m('.community-privacy', [
              'Public community ',
              m('span.icon-globe'),
            ]),
            m('p.community-description', [
              (app.chain && app.chain.meta && app.chain.meta.chain) ? app.chain.meta.chain.description
                : (!app.chain && app.community && app.community.meta) ? app.community.meta.description
                  : 'A new Commonwealth community',
            ]),
            app.isLoggedIn() && [
              (app.activeCommunityId() && app.community?.meta.privacyEnabled) ?
                m('a.btn.btn-block.disabled.MembershipButton', 'Joined ✓') :
                m(MembershipButton, { chain: app.activeChainId(), community: app.activeCommunityId() }),
              m(DiscussionsSubscriptionButton),
            ],
            m(TagSelector, { activeTag: vnode.attrs.tag }),
            pinnedThreads.length > 0
            && [
              m('h4.sidebar-header', 'Pinned'),
              m('.pinned-container.discussion-group-wrap', pinnedThreads),
            ],
            m(ChainOrCommunityRoles),
          ]),
        ]),
      ]),
    });
  },
};

export default DiscussionsPage;
