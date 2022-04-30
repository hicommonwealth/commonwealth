import 'pages/user_dashboard.scss';

import m from 'mithril';
import { Col, Tag } from 'construct-ui';
import app from 'state';
import { NodeInfo } from 'client/scripts/models';
import { pluralize } from 'helpers';
import { ChainIcon } from './chain_icon';
import { CWCard } from './component_kit/cw_card';
import { CWIcon } from './component_kit/cw_icons/cw_icon';

const getNewTag = (labelCount = null) => {
  const label = labelCount === null ? 'New' : `${labelCount} new`;
  return m('span.chain-new', [
    m(Tag, {
      label,
      size: 'xs',
      rounded: true,
      intent: 'primary',
      style: 'margin-top: -3px; margin-left: 10px;',
    }),
  ]);
};

const ChainCard: m.Component<{ chain: string; nodeList: NodeInfo[] }> = {
  view: (vnode) => {
    const { chain, nodeList } = vnode.attrs;
    const { unseenPosts } = app.user;
    const chainInfo = app.config.chains.getById(chain);
    const visitedChain = !!unseenPosts[chain];
    const updatedThreads = unseenPosts[chain]?.activePosts || 0;
    const monthlyThreadCount =
      app.recentActivity.getCommunityThreadCount(chain);

    return m(
      CWCard,
      {
        elevation: 'elevation-1',
        interactive: true,
        className: 'preview-chain-card',
        onclick: (e) => {
          e.preventDefault();
          m.route.set(`/${chain}`);
        },
      },
      [
        m('.card-top', [
          m(ChainIcon, { chain: nodeList[0].chain }),
          m('h3', chainInfo.name),
        ]),
        m('.card-bottom', [
          m('p.card-description', chainInfo.description),
          // if no recently active threads, hide this module altogether
          m(
            '.recent-activity',
            !!monthlyThreadCount && [
              m(
                'span.recent-threads',
                monthlyThreadCount > 20
                  ? [
                      pluralize(Math.floor(monthlyThreadCount / 5), 'thread'),
                      ' this week',
                    ]
                  : [pluralize(monthlyThreadCount, 'thread'), ' this month']
              ),
              app.user.isMember({
                account: app.user.activeAccount,
                chain,
              }) && [
                app.isLoggedIn() && !visitedChain && getNewTag(),
                updatedThreads > 0 && getNewTag(updatedThreads),
              ],
            ]
          ),
        ]),
      ]
    );
  },
};

const DashboardExplorePreview: m.Component = {
  view: (vnode) => {
    const chains = {};
    app.config.nodes.getAll().forEach((n) => {
      if (chains[n.chain.id]) {
        chains[n.chain.id].push(n);
      } else {
        chains[n.chain.id] = [n];
      }
    });

    const myChains: any = Object.entries(chains);

    const sortChainsAndCommunities = (list) =>
      list
        .sort((a, b) => {
          const threadCountA = app.recentActivity.getCommunityThreadCount(
            Array.isArray(a) ? a[0] : a.id
          );
          const threadCountB = app.recentActivity.getCommunityThreadCount(
            Array.isArray(b) ? b[0] : b.id
          );
          return threadCountB - threadCountA;
        })
        .map((entity) => {
          if (Array.isArray(entity)) {
            const [chain, nodeList]: [string, any] = entity as any;
            return m(ChainCard, { chain, nodeList });
          }
          return null;
        });

    const sortedChainsAndCommunities = sortChainsAndCommunities(
      myChains.filter((c) => c[1][0] && !c[1][0].chain.collapsedOnHomepage)
    );

    return m(Col, { span: { md: 3 }, class: 'expore-communities-col' }, [
      m(
        '.title',
        {
          onclick: () => {
            m.route.set('/communities');
            m.redraw();
          },
        },
        'Explore Communities'
      ),
      m('.communities-list', [
        sortedChainsAndCommunities.length > 3
          ? sortedChainsAndCommunities.slice(0, 3)
          : sortedChainsAndCommunities,
        m('.clear'),
      ]),
      m(
        'a',
        {
          class: 'link',
          onclick: () => {
            m.route.set('/communities');
            m.redraw();
          },
        },
        [
          'View more communities',
          m(CWIcon, {
            iconName: 'externalLink',
            iconSize: 'small',
          }),
        ]
      ),
    ]);
  },
};

export default DashboardExplorePreview;
