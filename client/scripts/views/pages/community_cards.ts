/* eslint-disable @typescript-eslint/ban-types */
import 'pages/landing/community_cards.scss';
import m from 'mithril';
import numeral from 'numeral';

import app from 'state';
import { NodeInfo } from 'models';
import { CWButton } from '../components/component_kit/cw_button';
import { CWCard } from '../components/component_kit/cw_card';
import Sublayout from '../sublayout';

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
    const chainInfo = app.config.chains.getById(chain);

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

const NewCommunityCard: m.Component = {
  view: () => {
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

// Corresponds to 'ChainCategoryTypes' id numbering (which currently only includes DeFi and DAO)
const filterMap = {
  DeFi: 1,
  DAO: 2,
  ERC20: 3,
  Cosmos: 4,
  Substrate: 5,
  Ethereum: 6,
};

const HomepageCommunityCards: m.Component<
  {},
  {
    filters: Array<boolean>;
    categoryMap: { [chain: string]: number[] };
  }
> = {
  oninit: (vnode) => {
    vnode.state.filters = [false, false, false, false, false, false];
    const categories = app.config.chainCategories;
    let categoryMap = {};
    // Build the category map
    for (const data of categories) {
      if (categoryMap[data.chain_id]) {
        categoryMap[data.chain_id].push(data.category_type_id);
      } else {
        categoryMap[data.chain_id] = [data.category_type_id];
      }
    }
    vnode.state.categoryMap = categoryMap;
  },
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

    const sortChains = (list, filters) => {
      let filteredList = list;
      // Filter via on-page filters
      if (filters.includes(true)) {
        let appliedFilters = [];
        for (let i = 0; i < filters.length; i++) {
          if (filters[i]) {
            appliedFilters.push(i + 1);
          }
        }

        filteredList = filteredList.filter((data) => {
          for (const filter of appliedFilters) {
            if (
              !vnode.state.categoryMap[data[0]] ||
              !vnode.state.categoryMap[data[0]].includes(filter)
            ) {
              return false;
            }
          }
          return true;
        });
      }
      // Filter by recent thread activity
      const res = filteredList
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
      return res;
    };

    const sortedChains = sortChains(
      myChains.filter((c) => c[1][0] && !c[1][0].chain.collapsedOnHomepage),
      vnode.state.filters
    );
    const betaChains = sortChains(
      myChains.filter((c) => c[1][0] && c[1][0].chain.collapsedOnHomepage),
      vnode.state.filters
    );

    const totalChainsString = buildCommunityString(
      sortedChains.length + betaChains.length
    );

    return m(
      '.HomepageCommunityCards',
      {
        style: 'margin-top: 40px',
      },
      [
        m('.header-section', [
          m('.communities-number', totalChainsString),
          m('.filter-buttons', [
            m(CWButton, {
              label: 'DeFi',
              buttonType: vnode.state.filters[filterMap['DeFi'] - 1]
                ? 'primary'
                : 'secondary',
              onclick: () => {
                vnode.state.filters[filterMap['DeFi'] - 1] =
                  !vnode.state.filters[filterMap['DeFi'] - 1];
              },
            }),
            m(CWButton, {
              label: 'DAO',
              buttonType: vnode.state.filters[filterMap['DAO'] - 1]
                ? 'primary'
                : 'secondary',
              onclick: () => {
                vnode.state.filters[filterMap['DAO'] - 1] =
                  !vnode.state.filters[filterMap['DAO'] - 1];
              },
            }),
            m(CWButton, {
              label: 'ERC20',
              buttonType: vnode.state.filters[filterMap['ERC20'] - 1]
                ? 'primary'
                : 'secondary',
              onclick: () => {
                vnode.state.filters[filterMap['ERC20'] - 1] =
                  !vnode.state.filters[filterMap['ERC20'] - 1];
              },
            }),
            m(CWButton, {
              label: 'Cosmos',
              buttonType: vnode.state.filters[filterMap['Cosmos'] - 1]
                ? 'primary'
                : 'secondary',
              onclick: () => {
                vnode.state.filters[filterMap['Cosmos'] - 1] =
                  !vnode.state.filters[filterMap['Cosmos'] - 1];
              },
            }),
            m(CWButton, {
              label: 'Substrate',
              buttonType: vnode.state.filters[filterMap['Substrate'] - 1]
                ? 'primary'
                : 'secondary',
              onclick: () => {
                vnode.state.filters[filterMap['Substrate'] - 1] =
                  !vnode.state.filters[filterMap['Substrate'] - 1];
              },
            }),
            m(CWButton, {
              label: 'Ethereum',
              buttonType: vnode.state.filters[filterMap['Ethereum'] - 1]
                ? 'primary'
                : 'secondary',
              onclick: () => {
                vnode.state.filters[filterMap['Ethereum'] - 1] =
                  !vnode.state.filters[filterMap['Ethereum'] - 1];
              },
            }),
          ]),
        ]),
        m('.communities-list', [
          sortedChains,
          m('.clear'),
          betaChains.length > 0 && m('h4', 'Testnets & Alpha Networks'),
          betaChains,
        ]),
        m('.other-list', [m(NewCommunityCard)]),
      ]
    );
  },
};

const CommunityCardPage: m.Component = {
  view: () => {
    return m(
      Sublayout,
      {
        class: 'Homepage',
      },
      [m(HomepageCommunityCards)]
    );
  },
};

export default CommunityCardPage;
