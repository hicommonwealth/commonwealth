/* eslint-disable @typescript-eslint/ban-types */
import 'pages/landing/community_cards.scss';
import m from 'mithril';
import { Tag } from 'construct-ui';

import app from 'state';
import { ChainInfo, NodeInfo } from 'models';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWCard } from '../../components/component_kit/cw_card';

var numeral = require('numeral');

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

const buildCommunityString = (numCommunities: number) => {
  let numberString = numCommunities;
  if (numCommunities >= 1000) {
    numberString = numeral(numCommunities).format('0.0a');
  }
  return `${numberString} Communities`;
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

    const redirectFunction = (e) => {
      e.preventDefault();
      localStorage['home-scrollY'] = window.scrollY;
      m.route.set(`/${chain}`);
    };

    // Potentially Temporary (could be built into create community flow)
    let pretty_description = '';
    if (chainInfo.description) {
      pretty_description =
        chainInfo.description[chainInfo.description.length - 1] === '.'
          ? chainInfo.description
          : `${chainInfo.description}.`;
    }

    const iconUrl =
      nodeList[0].chain.iconUrl || (nodeList[0].chain as any).icon_url;

    return m(
      CWCard,
      {
        elevation: 'elevation-2',
        interactive: true,
        className: 'chain-card',
        onclick: redirectFunction,
      },
      [
        m('.card-header', [
          iconUrl
            ? m('img.chain-icon', {
                src: iconUrl,
              })
            : m('.chain-icon.no-image'),
        ]),
        m('.card-body', [
          m('.community-name', { lang: 'en' }, chainInfo.name),
          m('.card-description', { lang: 'en' }, pretty_description),
          m('.join-button-wrapper', [
            m(CWButton, {
              buttonType: 'secondary',
              label: 'See More',
              onclick: redirectFunction,
            }),
          ]),
        ]),
      ]
    );
  },
};

const CommunityCard: m.Component<{ community: ChainInfo }> = {
  view: (vnode) => {
    const { community } = vnode.attrs;
    const { unseenPosts } = app.user;
    const visitedCommunity = !!unseenPosts[community.id];
    const updatedThreads = unseenPosts[community.id]?.activePosts || 0;
    const monthlyThreadCount = app.recentActivity.getCommunityThreadCount(
      community.id
    );

    const redirectFunction = (e) => {
      e.preventDefault();
      localStorage['home-scrollY'] = window.scrollY;
      m.route.set(`/${community.id}`);
    };

    let pretty_description = '';
    if (community.description) {
      pretty_description =
        community.description[community.description.length - 1] === '.'
          ? community.description
          : `${community.description}.`;
    }

    return m(
      CWCard,
      {
        elevation: 'elevation-2',
        interactive: true,
        className: 'chain-card',
        onclick: redirectFunction,
      },
      [
        m('.card-header', [
          community.iconUrl
            ? m('img.chain-icon', {
                src: community.iconUrl,
              })
            : m('.chain-icon.no-image'),
        ]),
        m('.card-body', [
          m('.community-name', { lang: 'en' }, community.name),
          m('.card-description', { lang: 'en' }, pretty_description),
          m('.join-button-wrapper', [
            m(CWButton, {
              buttonType: 'secondary',
              disabled: false,
              label: 'See More',
              onclick: redirectFunction,
            }),
          ]),
        ]),
      ]
    );
  },
};

const LockdropToolsCard: m.Component = {
  view: (vnode) => {
    return m(
      CWCard,
      {
        elevation: 'elevation-2',
        interactive: true,
        className: 'chain-card',
      },
      [
        m('.lockdrop-card-body', [
          m('h3', 'Edgeware Lockdrop Tools'),
          m(CWButton, {
            onclick: (e) => {
              e.preventDefault();
              localStorage['home-scrollY'] = window.scrollY;
              m.route.set('/edgeware/stats');
            },
            label: 'Lockdrop stats',
          }),
          m('.spacer', []),
          m(CWButton, {
            onclick: (e) => {
              e.preventDefault();
              localStorage['home-scrollY'] = window.scrollY;
              m.route.set('/edgeware/unlock');
            },
            label: 'Unlock ETH',
          }),
        ]),
      ]
    );
  },
};

const NewCommunityCard: m.Component = {
  view: (vnode) => {
    return m(
      CWCard,
      {
        elevation: 'elevation-2',
        interactive: true,
        className: 'chain-card',
        onclick: (e) => {
          e.preventDefault();
          document.location =
            'https://hicommonwealth.typeform.com/to/cRP27Rp5' as any;
        },
      },
      [
        m('.new-community-card-body', [
          m('h3', 'Create a new community'),
          m(
            'p.action',
            'Launch and grow your decentralized community on Commonwealth'
          ),
          m('a.learn-more', { href: '#' }, m.trust('Learn more &raquo;')),
        ]),
      ]
    );
  },
};

const HomepageCommunityCards: m.Component = {
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
          } else if (entity.id) {
            return m(CommunityCard, { community: entity });
          }
          return null;
        });

    const sortedChainsAndCommunities = sortChainsAndCommunities(
      myChains.filter((c) => c[1][0] && !c[1][0].chain.collapsedOnHomepage)
    );
    const betaChainsAndCommunities = sortChainsAndCommunities(
      myChains.filter((c) => c[1][0] && c[1][0].chain.collapsedOnHomepage)
    );

    const totalCommunitiesString = buildCommunityString(
      sortedChainsAndCommunities.length + betaChainsAndCommunities.length
    );

    return m(
      '.HomepageCommunityCards',
      {
        style: 'margin-top: 40px',
      },
      [
        m('.communities-list', [
          m('.communities-number', totalCommunitiesString),
          sortedChainsAndCommunities,
          m('.clear'),
          betaChainsAndCommunities.length > 0 &&
            m('h4', 'Testnets & Alpha Networks'),
          betaChainsAndCommunities,
        ]),
        m('.other-list', [m(NewCommunityCard), m(LockdropToolsCard)]),
      ]
    );
  },
};

export default HomepageCommunityCards;
