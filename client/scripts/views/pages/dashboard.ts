import 'pages/user_dashboard.scss';

import m from 'mithril';
import Infinite from 'mithril-infinite';
import { TabItem, Tabs, Tag, Col, Grid, Card, Icon, Icons } from 'construct-ui';

import app from 'state';
import { pluralize } from 'helpers';
import { NodeInfo, CommunityInfo } from 'models';
import { sortNotifications } from 'helpers/notifications';
import DashboardRow from 'views/components/dashboard_row';
import { ChainIcon, CommunityIcon } from 'views/components/chain_icon';
import Sublayout from 'views/sublayout';
import PageError from 'views/pages/error';
import PageLoading from 'views/pages/loading';

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
      elevation: 1,
      interactive: true,
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
            ' / week',
          ] : [
            pluralize(monthlyThreadCount, 'thread'),
            ' / month',
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

const CommunityCard : m.Component<{ community: CommunityInfo }> = {
  view: (vnode) => {
    const { community } = vnode.attrs;
    const { unseenPosts } = app.user;
    const visitedCommunity = !!unseenPosts[community.id];
    const updatedThreads = unseenPosts[community.id]?.activePosts || 0;
    const monthlyThreadCount = app.recentActivity.getCommunityThreadCount(community.id);

    return m(Card, {
      elevation: 1,
      interactive: true,
      class: 'home-card',
      onclick: (e) => {
        e.preventDefault();
        localStorage['home-scrollY'] = window.scrollY;
        m.route.set(`/${community.id}`);
      },
    }, [
      m('.card-top', [
        m(CommunityIcon, { community }),
        m('h3', [
          community.name,
          community.privacyEnabled && m(Icon, { name: Icons.LOCK, size: 'xs' }),
        ]),
      ]),
      m('.card-bottom', [
        m('p.card-description', community.description),
        // if no recently active threads, hide this module altogether
        m('.recent-activity', !!monthlyThreadCount && [
          m('span.recent-threads', monthlyThreadCount > 20 ? [
            pluralize(Math.floor(monthlyThreadCount / 5), 'thread'),
            ' / week',
          ] : [
            pluralize(monthlyThreadCount, 'thread'),
            ' / month',
          ]),
          app.user.isMember({ account: app.user.activeAccount, community: community.id })
            && [
              app.isLoggedIn() && !visitedCommunity && getNewTag(),
              updatedThreads > 0 && getNewTag(updatedThreads),
            ],
        ])
      ]),
    ]);
  }
};

const DashboardPage: m.Component<{}> = {
  view: (vnode) => {
    if (!app.isLoggedIn()) return m(PageError, {
      title: [
        'Notifications ',
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
      message: 'This page requires you to be logged in.'
    });

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
    const myCommunities: any = app.config.communities.getAll();

    const sortChainsAndCommunities = (list) => list.sort((a, b) => {
      const threadCountA = app.recentActivity.getCommunityThreadCount(Array.isArray(a) ? a[0] : a.id);
      const threadCountB = app.recentActivity.getCommunityThreadCount(Array.isArray(b) ? b[0] : b.id);
      return (threadCountB - threadCountA);
    }).map((entity) => {
      if (Array.isArray(entity)) {
        const [chain, nodeList]: [string, any] = entity as any;
        return  m(ChainCard, { chain, nodeList });
      } else if (entity.id) {
        return m(CommunityCard, { community: entity });
      }
      return null;
    });

    const sortedChainsAndCommunities = sortChainsAndCommunities(
      myChains.filter((c) => c[1][0] && !c[1][0].chain.collapsedOnHomepage)
        .concat(myCommunities.filter((c) => !c.collapsedOnHomepage))
    );

    return m(Sublayout, {
      class: 'UserDashboardPage',
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
              label: 'Latest',
              active: true,
              onclick: () => { },
            }),
            m(TabItem, {
              label: 'Trending',
              active: false,
              onclick: () => { },
            }),
            m(TabItem, {
              label: 'Chain',
              active: false,
              onclick: () => { },
            }),
          ]),
          m('.NotificationsList', [
            sortedNotifications.length > 0
              ? m(Infinite, {
                maxPages: 1, // prevents rollover/repeat
                key: sortedNotifications.length,
                pageData: () => sortedNotifications,
                item: (data, opts, index) => {
                  return m(DashboardRow, { notifications: data, onListPage: true, });
                },
              })
              : m('.no-notifications', 'No Notifications'),
          ])
        ]),
        m(Col, { span: { md: 3 } }, [
          m('.title', 'Explore Communities'),
          m('.communities-list', [
            sortedChainsAndCommunities.length > 3 ? sortedChainsAndCommunities.slice(0, 3) : sortedChainsAndCommunities,
            m('.clear'),
          ]),
        ])
      ]),
    ]);
  }
};

export default DashboardPage;
