/* @jsx m */

import m from 'mithril';
import numeral from 'numeral';

import 'pages/landing/community_cards.scss';

import app from 'state';
import { ChainInfo } from 'models';
import { ChainBase, ChainCategoryType, ChainNetwork } from 'types';
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

type ChainCardAttrs = { chain: ChainInfo };

class ChainCard implements m.ClassComponent<ChainCardAttrs> {
  view(vnode) {
    const { chain } = vnode.attrs as ChainCardAttrs;

    const redirectFunction = (e) => {
      e.preventDefault();
      localStorage['home-scrollY'] = window.scrollY;
      m.route.set(`/${chain}`);
    };

    // Potentially Temporary (could be built into create community flow)
    let prettyDescription = '';
    if (chain.description) {
      prettyDescription =
        chain.description[chain.description.length - 1] === '.'
          ? chain.description
          : `${chain.description}.`;
    }

    const iconUrl = chain.iconUrl;

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
            {chain.name}
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

export const buildChainToCategoriesMap = (
  categoryTypes,
  chainsAndCategories
) => {
  // Handle mapping provided by ChainCategories table
  const categoryMap = {};
  for (const data of categoryTypes) {
    categoryMap[data.id] = data.category_name;
  }
  const chainToCategoriesMap: { [chain: string]: ChainCategoryType[] } = {};
  for (const data of chainsAndCategories) {
    if (chainToCategoriesMap[data.chain_id]) {
      chainToCategoriesMap[data.chain_id].push(
        categoryMap[data.category_type_id]
      );
    } else {
      chainToCategoriesMap[data.chain_id] = [
        categoryMap[data.category_type_id],
      ];
    }
  }

  return chainToCategoriesMap;
};
class HomepageCommunityCards implements m.ClassComponent {
  private chainCategories: Array<string>;
  private chainNetworks: Array<string>;
  private chainBases: Array<string>;
  private filterMap: { [val: string]: boolean };
  private chainToCategoriesMap: { [chain: string]: string[] };
  oninit() {
    const chainsAndCategories = app.config.chainCategories;
    const categoryTypes = app.config.chainCategoryTypes;

    this.filterMap = {};
    this.chainCategories = categoryTypes.map(
      (category) => category.category_name
    );
    this.chainBases = Object.keys(ChainBase);
    this.chainNetworks = Object.keys(ChainNetwork).filter(
      (val) => val === 'ERC20'
    ); // We only are allowing ERC20 for now

    // Load Filter Map
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
    this.chainToCategoriesMap = buildChainToCategoriesMap(
      categoryTypes,
      chainsAndCategories
    );
  }
  view() {
    const chainBaseFilter = (list: ChainInfo[], filterMap) => {
      return list.filter((data) => {
        const chainBase =
          Object.keys(ChainBase)[
            Object.values(ChainBase).indexOf(data.base)
          ]; // Converts chain.base into a ChainBase key to match our filterMap keys

        return filterMap[chainBase];
      });
    };

    const chainNetworkFilter = (list: ChainInfo[], filterMap) => {
      return list.filter((data) => {
        const chainNetwork =
          Object.keys(ChainNetwork)[
            Object.values(ChainNetwork).indexOf(data.network)
          ]; // Converts chain.base into a ChainBase key to match our filterMap keys

        if (this.chainNetworks.includes(chainNetwork)) {
          return filterMap[chainNetwork];
        } else {
          return false;
        }
      });
    };

    const chainCategoryFilter = (list: ChainInfo[], filterMap) => {
      return list.filter((data) => {
        for (const cat of this.chainCategories) {
          if (
            this.filterMap[cat] &&
            (!this.chainToCategoriesMap[data.id] ||
              !this.chainToCategoriesMap[data.id].includes(cat))
          ) {
            return false;
          }
        }
        return true;
      });
    };

    const sortChains = (list: ChainInfo[], filterMap) => {
      let filteredList = list;

      if (Object.values(filterMap).includes(true)) {
        // Handle Overlaps
        if (this.chainBases.filter((val) => filterMap[val]).length > 1) {
          filteredList = [];
        }
        if (this.chainNetworks.filter((val) => filterMap[val]).length > 1) {
          filteredList = [];
        }

        // Filter for ChainBase
        const chainBaseFilterOn =
          this.chainBases.filter((base) => filterMap[base]).length > 0;

        if (chainBaseFilterOn) {
          filteredList = chainBaseFilter(filteredList, filterMap);
        }

        // Filter for ChainNetwork
        const chainNetworkFilterOn =
          this.chainNetworks.filter((network) => filterMap[network]).length > 0;

        if (chainNetworkFilterOn) {
          filteredList = chainNetworkFilter(filteredList, filterMap);
        }

        // Filter for ChainCategory
        const chainCategoryFilterOn =
          this.chainCategories.filter((cat) => filterMap[cat]).length > 0;

        if (chainCategoryFilterOn) {
          filteredList = chainCategoryFilter(filteredList, filterMap);
        }
      }
      // Filter by recent thread activity
      const res = filteredList
        .sort((a, b) => {
          const threadCountA = app.recentActivity.getCommunityThreadCount(a.id);
          const threadCountB = app.recentActivity.getCommunityThreadCount(b.id);
          return threadCountB - threadCountA;
        })
        .map((chain: ChainInfo) => {
          return m(ChainCard, { chain });
        });
      return res;
    };

    const sortedChains = sortChains(app.config.chains.getAll(), this.filterMap);

    const totalCommunitiesString = buildCommunityString(sortedChains.length);

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
        <div class="communities-list">
          {sortedChains}
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
    return (
      <Sublayout>
        <HomepageCommunityCards />
      </Sublayout>
    );
  },
};

export default CommunityCardPage;
