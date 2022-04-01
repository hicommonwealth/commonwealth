/* @jsx m */

import m from 'mithril';
import numeral from 'numeral';

import 'pages/landing/community_cards.scss';

import app from 'state';
import { ChainInfo, NodeInfo } from 'models';
import { CWButton } from '../components/component_kit/cw_button';
import { CWCard } from '../components/component_kit/cw_card';
import Sublayout from '../sublayout';
import { ChainBase, ChainCategoryType, ChainNetwork } from 'types';

const buildCommunityString = (numCommunities: number) => {
  let numberString = numCommunities;
  if (numCommunities >= 1000) {
    numberString = numeral(numCommunities).format('0.0a');
  }
  return `${numberString} Communities`;
};

type ChainCardAttrs = { chain: string; nodeList: NodeInfo[] };

class ChainCard implements m.ClassComponent<ChainCardAttrs> {
  view(vnode) {
    const { chain, nodeList } = vnode.attrs;
    const chainInfo = app.config.chains.getById(chain);

    const redirectFunction = (e) => {
      e.preventDefault();
      localStorage['home-scrollY'] = window.scrollY;
      m.route.set(`/${chain}`);
    };

    // Potentially Temporary (could be built into create community flow)
    let prettyDescription = '';
    if (chainInfo.description) {
      prettyDescription =
        chainInfo.description[chainInfo.description.length - 1] === '.'
          ? chainInfo.description
          : `${chainInfo.description}.`;
    }

    const iconUrl =
      nodeList[0].chain.iconUrl || (nodeList[0].chain as any).icon_url;

    return (
      <CWCard
        elevation="elevation-2"
        interactive={true}
        className="chain-card"
        onclick={redirectFunction}
      >
        <div class="card-header">
          {iconUrl ? (
            <img class="chain-icon" src={iconUrl} />
          ) : (
            <div class="chain-icon no-image" />
          )}
        </div>
        <div class="card-body">
          <div class="community-name" lang="en">
            {chainInfo.name}
          </div>
          <div class="card-description" title={prettyDescription} lang="en">
            {prettyDescription}
          </div>
          <div class="join-button-wrapper">
            <CWButton
              buttonType="secondary"
              label="See More"
              onclick={redirectFunction}
            />
          </div>
        </div>
      </CWCard>
    );
  }
}

// Corresponds to 'ChainCategoryTypes' id numbering (which currently only includes DeFi and DAO)
const filterMap = {
  DeFi: 1,
  DAO: 2,
  ERC20: 3,
  Cosmos: 4,
  Substrate: 5,
  Ethereum: 6,
};

class HomepageCommunityCards implements m.ClassComponent {
  private filters: Array<boolean>;
  private chainCategories: Array<string>;
  private chainNetworks: Array<string>;
  private chainBases: Array<string>;
  private filterMap: { [val: string]: boolean };
  private categoryMap: { [chain: string]: number[] };
  oninit() {
    this.filters = [false, false, false, false, false, false];
    this.filterMap = {};
    this.chainCategories = Object.keys(ChainCategoryType);
    this.chainBases = Object.keys(ChainBase);
    this.chainNetworks = Object.keys(ChainNetwork).filter(
      (val) => val === 'ERC20'
    ); // We only are allowing ERC20 for now

    for (const cat of this.chainCategories) {
      this.filterMap[cat] = false;
    }
    for (const base of this.chainBases) {
      this.filterMap[base] = false;
    }
    for (const network of this.chainNetworks) {
      this.filterMap[network] = false;
    }

    // Handle mapping provided by ChainCategories table

    const categories = app.config.chainCategories;
    const categoryTypes = app.config.chainCategoryTypes;
    console.log(categoryTypes);
    let categoryMap = {};
    for (const data of categories) {
      if (categoryMap[data.chain_id]) {
        categoryMap[data.chain_id].push(data);
      } else {
        categoryMap[data.chain_id] = [data.category_type_id];
      }
    }
    this.categoryMap = categoryMap;
  }
  view() {
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
      // 1. filter via chainCategory, 2 filter via chainNetwork, 3 filter via chainBase. All using the filterMap

      if (Object.values(this.filterMap).includes(true)) {
        // Filter for ChainCategory

        console.log(this.filterMap);
      }
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
              !this.categoryMap[data[0]] ||
              !this.categoryMap[data[0]].includes(filter)
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
      this.filters
    );
    const betaChains = sortChains(
      myChains.filter((c) => c[1][0] && c[1][0].chain.collapsedOnHomepage),
      this.filters
    );

    const totalCommunitiesString = buildCommunityString(
      sortedChains.length + betaChains.length
    );

    return (
      <div class="HomepageCommunityCards">
        <div class="header-section">
          <div class="communities-header">{totalCommunitiesString}</div>
          <div class="filter-buttons">
            {this.chainCategories.map((cat) => {
              return (
                <CWButton
                  label={cat}
                  className="filter-button"
                  buttonType={this.filterMap[cat] ? 'primary' : 'secondary'}
                  onclick={() => {
                    this.filterMap[cat] = !this.filterMap[cat];
                  }}
                />
              );
            })}
            {this.chainNetworks.map((network) => {
              return (
                <CWButton
                  label={network}
                  className="filter-button"
                  buttonType={this.filterMap[network] ? 'primary' : 'secondary'}
                  onclick={() => {
                    this.filterMap[network] = !this.filterMap[network];
                  }}
                />
              );
            })}
            {this.chainBases.map((base) => {
              return (
                <CWButton
                  label={base}
                  className="filter-button"
                  buttonType={this.filterMap[base] ? 'primary' : 'secondary'}
                  onclick={() => {
                    this.filterMap[base] = !this.filterMap[base];
                  }}
                />
              );
            })}
          </div>
        </div>

        <div class="communities-list">{sortedChains}</div>
        <div class="communities-header">
          {betaChains.length > 0 && <h4>Testnets & Alpha Networks</h4>}
        </div>
        <div class="communities-list">
          {betaChains}
          <CWCard
            elevation="elevation-2"
            interactive={true}
            className="chain-card"
            onclick={(e) => {
              e.preventDefault();
              document.location =
                'https://hicommonwealth.typeform.com/to/cRP27Rp5' as any;
            }}
          >
            <div class="new-community-card-body">
              <h3>Create a new community</h3>
              <p class="action">
                Launch and grow your decentralized community on Commonwealth
              </p>
              <a class="learn-more" href="#">
                {m.trust('Learn more &raquo;')}
              </a>
            </div>
          </CWCard>
        </div>
      </div>
    );
  }
}

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
