import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  } from 'mithrilInterop';
import type { ChainCategoryType } from 'common-common/src/types';
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import type { ChainInfo } from 'models';
import numeral from 'numeral';

import 'pages/communities.scss';

import app from 'state';
import { CommunityCard, NewCommunityCard } from '../components/community_card';
import { CWButton } from '../components/component_kit/cw_button';
import { CWText } from '../components/component_kit/cw_text';
import Sublayout from '../sublayout';

const buildCommunityString = (numCommunities: number) => {
  let numberString = numCommunities;
  if (numCommunities >= 1000) {
    numberString = numeral(numCommunities).format('0.0a');
  }
  return `${numberString} Communities`;
};
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

class CommunitiesPage extends ClassComponent {
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
          Object.keys(ChainBase)[Object.values(ChainBase).indexOf(data.base)];
        // Converts chain.base into a ChainBase key to match our filterMap keys

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

    const chainCategoryFilter = (list) => {
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
          filteredList = chainCategoryFilter(filteredList);
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
          return render(CommunityCard, { chain });
        });

      return res;
    };

    const sortedChains = sortChains(app.config.chains.getAll(), this.filterMap);

    const totalCommunitiesString = buildCommunityString(sortedChains.length);

    return (
      <Sublayout>
        <div className="CommunitiesPage">
          <div className="header-section">
            <CWText
              type="h3"
              fontWeight="semiBold"
              className="communities-count"
            >
              {totalCommunitiesString}
            </CWText>
            <div className="filter-buttons">
              {this.chainCategories.map((cat) => {
                return (
                  <CWButton
                    label={cat}
                    buttonType={
                      this.filterMap[cat] ? 'primary-black' : 'secondary-black'
                    }
                    onClick={() => {
                      this.filterMap[cat] = !this.filterMap[cat];
                    }}
                  />
                );
              })}
              {this.chainNetworks.map((network) => {
                return (
                  <CWButton
                    label={network}
                    buttonType={
                      this.filterMap[network]
                        ? 'primary-black'
                        : 'secondary-black'
                    }
                    onClick={() => {
                      this.filterMap[network] = !this.filterMap[network];
                    }}
                  />
                );
              })}
              {this.chainBases.map((base) => {
                return (
                  <CWButton
                    label={base}
                    buttonType={
                      this.filterMap[base] ? 'primary-black' : 'secondary-black'
                    }
                    onClick={() => {
                      this.filterMap[base] = !this.filterMap[base];
                    }}
                  />
                );
              })}
            </div>
          </div>
          <div className="communities-list">
            {sortedChains}
            <NewCommunityCard />
          </div>
        </div>
      </Sublayout>
    );
  }
}

export default CommunitiesPage;
