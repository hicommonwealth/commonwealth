import 'pages/user_dashboard.scss';

import m from 'mithril';
import { Col, Tag } from 'construct-ui';
import app from 'state';
import { ChainInfo, NodeInfo } from 'client/scripts/models';
import { isCommandClick, pluralize } from 'helpers';
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

const ChainCard: m.Component<{ chain: ChainInfo }> = {
  view: (vnode) => {
    const { chain } = vnode.attrs;
    const { unseenPosts } = app.user;
    const visitedChain = !!unseenPosts[chain.id];
    const updatedThreads = unseenPosts[chain.id]?.activePosts || 0;
    const monthlyThreadCount = app.recentActivity.getCommunityThreadCount(
      chain.id
    );

    return m(
      CWCard,
      {
        elevation: 'elevation-1',
        interactive: true,
        className: 'preview-chain-card',
        onclick: (e) => {
          e.preventDefault();
          if (isCommandClick(e)) {
            window.open(`/${chain.id}`, '_blank');
            return;
          }
          m.route.set(`/${chain.id}`);
        },
      },
      [
        m('.card-top', [m(ChainIcon, { chain }), m('h3', chain.name)]),
        m('.card-bottom', [
          m('p.card-description', chain.description),
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
                chain: chain.id,
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
    const sortedChains = app.config.chains
      .getAll()
      .sort((a, b) => {
        const threadCountA = app.recentActivity.getCommunityThreadCount(a.id);
        const threadCountB = app.recentActivity.getCommunityThreadCount(b.id);
        return threadCountB - threadCountA;
      })
      .map((chain) => {
        return m(ChainCard, { chain });
      });

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
        sortedChains.length > 3 ? sortedChains.slice(0, 3) : sortedChains,
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
