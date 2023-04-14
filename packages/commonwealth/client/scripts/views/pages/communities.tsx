import type { ChainCategoryType } from 'common-common/src/types';
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import numeral from 'numeral';

import 'pages/communities.scss';
import React from 'react';
import type { ChainCategoryAttributes } from 'server/models/chain_category';
import type { ChainCategoryTypeAttributes } from 'server/models/chain_category_type';

import app from 'state';
import { CommunityCard, NewCommunityCard } from '../components/community_card';
import { CWButton } from '../components/component_kit/cw_button';
import { CWText } from '../components/component_kit/cw_text';
import Sublayout from '../sublayout';

const buildCommunityString = (numCommunities: number) =>
  numCommunities >= 1000
    ? `${numeral(numCommunities).format('0.0a')} Communities`
    : `${numCommunities} Communities`;

export const buildChainToCategoriesMap = (
  categoryTypes: Array<ChainCategoryTypeAttributes>,
  chainsAndCategories: Array<ChainCategoryAttributes>
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

const chainsAndCategories = app.config.chainCategories;
const categoryTypes = app.config.chainCategoryTypes;
const chainToCategoriesMap = buildChainToCategoriesMap(
  categoryTypes,
  chainsAndCategories
);
// Handle mapping provided by ChainCategories table
const chainCategories = categoryTypes.map((category) => category.category_name);
const chainNetworks = Object.keys(ChainNetwork).filter(
  (val) => val === 'ERC20'
); // We only are allowing ERC20 for now
const chainBases = Object.keys(ChainBase);

const getInitialFilterMap = (): Record<string, unknown> => {
  const filterMapChainCategories = chainCategories.map((c) => ({
    [c]: false,
  }));
  const filterMapChainBases = chainBases.map((c) => ({ [c]: false }));
  const filterMapChainNetworks = chainNetworks.map((c) => ({ [c]: false }));
  const allArrays = filterMapChainCategories.concat(
    filterMapChainBases,
    filterMapChainNetworks
  );

  return Object.assign({}, ...allArrays);
};

const CommunitiesPage = () => {
  const [filterMap, setFilterMap] = React.useState<Record<string, unknown>>(
    getInitialFilterMap()
  );

  const handleSetFilterMap = (key: string) => {
    setFilterMap((prevState) => ({ ...prevState, [key]: !filterMap[key] }));
  };

  const chainBaseFilter = (list: ChainInfo[]) => {
    return list.filter((data) => {
      const chainBase =
        Object.keys(ChainBase)[Object.values(ChainBase).indexOf(data.base)];
      // Converts chain.base into a ChainBase key to match our filterMap keys
      return filterMap[chainBase];
    });
  };

  const chainNetworkFilter = (list: ChainInfo[]) => {
    return list.filter((data) => {
      const chainNetwork =
        Object.keys(ChainNetwork)[
          Object.values(ChainNetwork).indexOf(data.network)
        ]; // Converts chain.base into a ChainBase key to match our filterMap keys

      if (chainNetworks.includes(chainNetwork)) {
        return filterMap[chainNetwork];
      } else {
        return false;
      }
    });
  };

  const chainCategoryFilter = (list) => {
    return list.filter((data) => {
      for (const cat of chainCategories) {
        if (
          filterMap[cat] &&
          (!chainToCategoriesMap[data.id] ||
            !chainToCategoriesMap[data.id].includes(cat as ChainCategoryType))
        ) {
          return false;
        }
      }
      return true;
    });
  };

  const sortChains = (list: ChainInfo[]) => {
    let filteredList = list;

    if (Object.values(filterMap).includes(true)) {
      // Handle Overlaps
      if (chainBases.filter((val) => filterMap[val]).length > 1) {
        filteredList = [];
      }

      if (chainNetworks.filter((val) => filterMap[val]).length > 1) {
        filteredList = [];
      }

      // Filter for ChainBase
      if (chainBases.filter((base) => filterMap[base]).length > 0) {
        filteredList = chainBaseFilter(filteredList);
      }

      // Filter for ChainNetwork
      if (chainNetworks.filter((network) => filterMap[network]).length > 0) {
        filteredList = chainNetworkFilter(filteredList);
      }

      // Filter for ChainCategory
      if (chainCategories.filter((cat) => filterMap[cat]).length > 0) {
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
      .map((chain: ChainInfo, i) => {
        return <CommunityCard key={i} chain={chain} />;
      });

    return res;
  };

  const sortedChains = sortChains(app.config.chains.getAll());

  return (
    <Sublayout>
      <div className="CommunitiesPage">
        <div className="header-section">
          <CWText type="h3" fontWeight="semiBold" className="communities-count">
            {buildCommunityString(sortedChains.length)}
          </CWText>
          <div className="filter-buttons">
            {chainCategories.map((cat, i) => {
              return (
                <CWButton
                  key={i}
                  label={cat}
                  buttonType={
                    filterMap[cat] ? 'primary-black' : 'secondary-black'
                  }
                  onClick={() => {
                    handleSetFilterMap(cat);
                  }}
                />
              );
            })}
            {chainNetworks.map((network, i) => {
              return (
                <CWButton
                  key={i}
                  label={network}
                  buttonType={
                    filterMap[network] ? 'primary-black' : 'secondary-black'
                  }
                  onClick={() => {
                    handleSetFilterMap(network);
                  }}
                />
              );
            })}
            {chainBases.map((base, i) => {
              return (
                <CWButton
                  key={i}
                  label={base}
                  buttonType={
                    filterMap[base] ? 'primary-black' : 'secondary-black'
                  }
                  onClick={() => {
                    handleSetFilterMap(base);
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
};

export default CommunitiesPage;
