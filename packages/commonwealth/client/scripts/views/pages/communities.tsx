import {
  ChainBase,
  ChainCategoryType,
  ChainNetwork,
} from '@hicommonwealth/core';
import numeral from 'numeral';
import 'pages/communities.scss';
import React from 'react';
import app from 'state';
import CommunityInfo from '../../models/ChainInfo';
import { CommunityCard, NewCommunityCard } from '../components/community_card';
import { CWButton } from '../components/component_kit/cw_button';
import { CWText } from '../components/component_kit/cw_text';

const buildCommunityString = (numCommunities: number) =>
  numCommunities >= 1000
    ? `${numeral(numCommunities).format('0.0a')} Communities`
    : `${numCommunities} Communities`;

const communityToCategoriesMap = app.config.chainCategoryMap;
// Handle mapping provided by ChainCategories table
const communityCategories = Object.values(ChainCategoryType);
const communityNetworks = Object.keys(ChainNetwork).filter(
  (val) => val === 'ERC20',
); // We only are allowing ERC20 for now
const communityBases = Object.keys(ChainBase);

const getInitialFilterMap = (): Record<string, unknown> => {
  const filterMapCommunityCategories = communityCategories.map((c) => ({
    [c]: false,
  }));
  const filterMapCommunityBases = communityBases.map((c) => ({ [c]: false }));
  const filterMapCommunityNetworks = communityNetworks.map((c) => ({
    [c]: false,
  }));
  const allArrays = filterMapCommunityCategories.concat(
    filterMapCommunityBases,
    filterMapCommunityNetworks,
  );

  return Object.assign({}, ...allArrays);
};

const CommunitiesPage = () => {
  const [filterMap, setFilterMap] = React.useState<Record<string, unknown>>(
    getInitialFilterMap(),
  );

  const handleSetFilterMap = (key: string) => {
    setFilterMap((prevState) => ({ ...prevState, [key]: !filterMap[key] }));
  };

  const chainBaseFilter = (list: CommunityInfo[]) => {
    return list.filter((data) => {
      const chainBase =
        Object.keys(ChainBase)[Object.values(ChainBase).indexOf(data.base)];
      // Converts chain.base into a ChainBase key to match our filterMap keys
      return filterMap[chainBase];
    });
  };

  const communityNetworkFilter = (list: CommunityInfo[]) => {
    return list.filter((data) => {
      const communityNetwork =
        Object.keys(ChainNetwork)[
          Object.values(ChainNetwork).indexOf(data.network)
        ]; // Converts chain.base into a ChainBase key to match our filterMap keys

      if (communityNetworks.includes(communityNetwork)) {
        return filterMap[communityNetwork];
      } else {
        return false;
      }
    });
  };

  const communityCategoryFilter = (list) => {
    return list.filter((data) => {
      for (const cat of communityCategories) {
        if (
          filterMap[cat] &&
          (!communityToCategoriesMap[data.id] ||
            !communityToCategoriesMap[data.id].includes(
              cat as ChainCategoryType,
            ))
        ) {
          return false;
        }
      }
      return true;
    });
  };

  const sortCommunities = (list: CommunityInfo[]) => {
    let filteredList = list;

    if (Object.values(filterMap).includes(true)) {
      // Handle Overlaps
      if (communityBases.filter((val) => filterMap[val]).length > 1) {
        filteredList = [];
      }

      if (communityNetworks.filter((val) => filterMap[val]).length > 1) {
        filteredList = [];
      }

      // Filter for ChainBase
      if (communityBases.filter((base) => filterMap[base]).length > 0) {
        filteredList = chainBaseFilter(filteredList);
      }

      // Filter for ChainNetwork
      if (
        communityNetworks.filter((network) => filterMap[network]).length > 0
      ) {
        filteredList = communityNetworkFilter(filteredList);
      }

      // Filter for ChainCategory
      if (communityCategories.filter((cat) => filterMap[cat]).length > 0) {
        filteredList = communityCategoryFilter(filteredList);
      }
    }
    // Filter by recent thread activity
    const res = filteredList
      .sort((a, b) => {
        const threadCountA = app.recentActivity.getCommunityThreadCount(a.id);
        const threadCountB = app.recentActivity.getCommunityThreadCount(b.id);
        return threadCountB - threadCountA;
      })
      .map((community: CommunityInfo, i) => {
        return <CommunityCard key={i} community={community} />;
      });

    return res;
  };

  const sortedCommunities = sortCommunities(app.config.chains.getAll());

  return (
    <div className="CommunitiesPage">
      <div className="header-section">
        <div>
          <CWText type="h3" fontWeight="semiBold" className="communities-count">
            Explore Communities
          </CWText>
          <CWText type="h3" fontWeight="semiBold" className="communities-count">
            {buildCommunityString(sortedCommunities.length)}
          </CWText>
        </div>
        <div className="filter-buttons">
          {communityCategories.map((cat, i) => {
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
          {communityNetworks.map((network, i) => {
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
          {communityBases.map((base, i) => {
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
        {sortedCommunities}
        <NewCommunityCard />
      </div>
    </div>
  );
};

export default CommunitiesPage;
