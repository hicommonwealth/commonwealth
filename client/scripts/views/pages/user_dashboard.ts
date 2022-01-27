import 'pages/user_dashboard.scss';

import m from 'mithril';
import _, { capitalize } from 'lodash';
import $ from 'jquery';
import { TabItem, Tabs, Tag, Col, Grid, Card, Icon, Icons, Spinner } from 'construct-ui';

import app from 'state';
import { pluralize } from 'helpers';
import { NodeInfo } from 'models';
import { sortNotifications } from 'helpers/notifications';
import UserDashboardRow from 'views/components/user_dashboard_row';
import { ChainIcon } from 'views/components/chain_icon';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
// import StaticLandingPage from './landing/landing_page';

const getNewTag = (labelCount = null) => {
  const label = labelCount === null ? 'New' : `${labelCount} new`;
  return m('span.chain-new', [
    m(Tag, {
      label,
      size: 'xs',
      rounded: true,
      intent: 'primary',
      style: 'margin-top: -3px; margin-left: 10px;',
    })
  ]);
};

const ChainCard : m.Component<{ chain: string, nodeList: NodeInfo[] }> = {
  view: (vnode) => {
    const { chain, nodeList } = vnode.attrs;
    const { unseenPosts } = app.user;
    const chainInfo = app.config.chains.getById(chain);
    const visitedChain = !!unseenPosts[chain];
    const updatedThreads = unseenPosts[chain]?.activePosts || 0;
    const monthlyThreadCount = app.recentActivity.getCommunityThreadCount(chain);

    return m(Card, {
      class: 'home-card',
      onclick: (e) => {
        e.preventDefault();
        localStorage['home-scrollY'] = window.scrollY;
        m.route.set(`/${chain}`);
      },
    }, [
      m('.card-top', [
        m(ChainIcon, { chain: nodeList[0].chain }),
        m('h3', chainInfo.name),
      ]),
      m('.card-bottom', [
        m('p.card-description', chainInfo.description),
        // if no recently active threads, hide this module altogether
        m('.recent-activity', !!monthlyThreadCount && [
          m('span.recent-threads', monthlyThreadCount > 20 ? [
            pluralize(Math.floor(monthlyThreadCount / 5), 'thread'),
            ' this week',
          ] : [
            pluralize(monthlyThreadCount, 'thread'),
            ' this month',
          ]),
          app.user.isMember({
            account: app.user.activeAccount,
            chain,
          }) && [
            app.isLoggedIn() && !visitedChain && getNewTag(),
            updatedThreads > 0 && getNewTag(updatedThreads),
          ],
        ])
      ]),
    ]);
  }
};



const notificationsRemaining = (contentLength, count) => {
  return (contentLength >= 10 && count < contentLength);
};

export enum DashboardViews {
  Latest = 'latest',
  Trending = 'trending',
  Chain = 'chain',
}

const UserDashboard: m.Component<{}, {
  count: number;
  activeTab: DashboardViews;
  onscroll;
}> = {
  oncreate: (vnode) => {
    vnode.state.count = 10;
  },
  view: (vnode) => {
    if (!app.isLoggedIn()) {
      // return m(StaticLandingPage);
    }
    if (!vnode.state.activeTab) {
      vnode.state.activeTab = DashboardViews.Latest;
    }
    const { activeTab } = vnode.state;
    // const activeEntity = app.community ? app.community : app.chain;
    const activeEntity = 'edgeware';
    if (!activeEntity) return m(PageLoading, {
      title: [
        'Notifications ',
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
    });

    const notifications = app.user.notifications?.notifications || [];
    const sortedNotifications = sortNotifications(notifications).reverse();

    const chains = {};
    app.config.nodes.getAll().forEach((n) => {
      if (chains[n.chain.id]) {
        chains[n.chain.id].push(n);
      } else {
        chains[n.chain.id] = [n];
      }
    });

    const myChains: any = Object.entries(chains);

    const sortChainsAndCommunities = (list) => list.sort((a, b) => {
      const threadCountA = app.recentActivity.getCommunityThreadCount(Array.isArray(a) ? a[0] : a.id);
      const threadCountB = app.recentActivity.getCommunityThreadCount(Array.isArray(b) ? b[0] : b.id);
      return (threadCountB - threadCountA);
    }).map((entity) => {
      if (Array.isArray(entity)) {
        const [chain, nodeList]: [string, any] = entity as any;
        return  m(ChainCard, { chain, nodeList });
      } 
      return null;
    });

    const sortedChainsAndCommunities = sortChainsAndCommunities(
      myChains.filter((c) => c[1][0] && !c[1][0].chain.collapsedOnHomepage)
    );

    vnode.state.onscroll = _.debounce(async () => {
      if (!notificationsRemaining(sortedNotifications.length, vnode.state.count)) return;
      const scrollHeight = $(document).height();
      const scrollPos = $(window).height() + $(window).scrollTop();
      if (scrollPos > (scrollHeight - 400)) {
        vnode.state.count += 10;
        m.redraw();
      }
    }, 400);

    $(window).on('scroll', vnode.state.onscroll);

    return m(Sublayout, {
      class: 'UserDashboard',
      title: [
        'Dashboard ',
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
    }, [
      m(Grid, {
        class: 'forum-container',
        gutter: 20
      }, [
        m(Col, { span: { md: 9 } }, [
          m('.title', 'Activity'),
          m(Tabs, {
            align: 'left',
            bordered: false,
            fluid: true,
          }, [
            m(TabItem, {
              label: capitalize(DashboardViews.Latest),
              active: activeTab === DashboardViews.Latest,
              onclick: () => {
                vnode.state.activeTab = DashboardViews.Latest;
              },
            }),
            m(TabItem, {
              label: capitalize(DashboardViews.Trending),
              active: activeTab === DashboardViews.Trending,
              onclick: () => {
                vnode.state.activeTab = DashboardViews.Trending;
              },
            }),
            m(TabItem, {
              label: capitalize(DashboardViews.Chain),
              active: activeTab === DashboardViews.Chain,
              onclick: () => {
                vnode.state.activeTab = DashboardViews.Chain;
              },
            }),
          ]),
          m('.dashboard-row-wrap', [
            // sortedNotifications.length > 0
            //   ? m(Infinite, {
            //     maxPages: 1, // prevents rollover/repeat
            //     key: sortedNotifications.length,
            //     pageData: () => sortedNotifications,
            //     item: (data, opts, index) => {
            //       return m(UserDashboardRow, { notifications: data, onListPage: true, });
            //     },
            //   })
            //   : m('.no-notifications', 'No Notifications'),
            sortedNotifications.length > 0
            ? [
              sortedNotifications.slice(0, vnode.state.count).map((data) => {
                return m(UserDashboardRow, { notifications: data, onListPage: true, });
              }),
              notificationsRemaining(sortedNotifications.length, vnode.state.count)
              ? m('.infinite-scroll-spinner-wrap .text-center', [
                m(Spinner, { active: true })
              ])
              : ''
            ]
            : m('.no-notifications', 'No Notifications'),
          ])
        ]),
        m(Col, { span: { md: 3 }, class:'expore-communities-col' }, [
          m('.title', 'Explore Communities'),
          m('.communities-list', [
            sortedChainsAndCommunities.length > 3 ? sortedChainsAndCommunities.slice(0, 3) : sortedChainsAndCommunities,
            m('.clear'),
          ]),
          m('a',{
            class:'link',
            onclick: () => {
              m.route.set('/communities');
              m.redraw();
            }
          }, [
            'View more communities',
            m(Icon, {
              name: Icons.EXTERNAL_LINK,
            })
          ]),
        ])
      ]),
    ]);
  }
};

export default UserDashboard;
