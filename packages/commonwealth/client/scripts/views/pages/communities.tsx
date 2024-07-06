import {
  ChainBase,
  ChainNetwork,
  CommunityCategoryType,
} from '@hicommonwealth/shared';
import useUserLoggedIn from 'client/scripts/hooks/useUserLoggedIn';
import { useManageCommunityStakeModalStore } from 'client/scripts/state/ui/modals';
import { findDenominationString } from 'helpers/findDenomination';
import numeral from 'numeral';
import 'pages/communities.scss';
import React, { useRef } from 'react';
import app from 'state';
import useFetchActiveCommunitiesQuery from 'state/api/communities/fetchActiveCommunities';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import {
  default as ChainInfo,
  default as CommunityInfo,
} from '../../models/ChainInfo';
import { useFetchEthUsdRateQuery } from '../../state/api/communityStake/index';
import { trpc } from '../../utils/trpcClient';
import { NewCommunityCard } from '../components/CommunityCard';
import { CWDivider } from '../components/component_kit/cw_divider';
import { CWIcon } from '../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../components/component_kit/cw_text';
import { CWButton } from '../components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from '../components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWModal } from '../components/component_kit/new_designs/CWModal';
import { CWRelatedCommunityCard } from '../components/component_kit/new_designs/CWRelatedCommunityCard';
import ManageCommunityStakeModal from '../modals/ManageCommunityStakeModal/ManageCommunityStakeModal';
import { CommunityLaunchCard } from '../components/CommunityLaunchCard';
import useQuickCreateCommunity from 'client/scripts/hooks/useQuickCreateCommunity';

const buildCommunityString = (numCommunities: number) =>
  numCommunities >= 1000
    ? `${numeral(numCommunities).format('0.0a')} Communities`
    : `${numCommunities} Communities`;

const communityToCategoriesMap = app.config.chainCategoryMap;
// Handle mapping provided by ChainCategories table
const communityCategories = Object.values(CommunityCategoryType);
const communityNetworks = Object.keys(ChainNetwork).filter(
  (val) => val === 'ERC20',
); // We only are allowing ERC20 for now
const communityBases = Object.keys(ChainBase);

// const {
//   handleCompleteBasicInformationStep,
//   createdCommunityId,
//   createdCommunityName,
// } = useCreateCommunity();

const handleLaunchIdea = async (name: string) => {
  try {
    const { createCommunity } = useQuickCreateCommunity();
    await createCommunity(name);
    // TODO: Handle success, maybe redirect to the new community page
    console.log('Community created successfully');
  } catch (err) {
    console.error('Failed to create community:', err);
  }
};

const generateMissingFields = async (name: string) => {
  // TODO: Implement OpenAI API call to generate missing fields
  // This is a placeholder implementation
  return {
    description: `A community for ${name}`,
    icon_url: 'https://example.com/default-icon.png',
    // Add other required fields here
  };
};

const uploadImage = async (file: File): Promise<string> => {
  // TODO: Implement image upload logic
  // This is a placeholder implementation
  return 'https://example.com/uploaded-image.png';
};

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

const STAKE_FILTER_KEY = 'Stake';

const CommunitiesPage = () => {
  useUserLoggedIn();
  const [filterMap, setFilterMap] = React.useState<Record<string, unknown>>(
    getInitialFilterMap(),
  );
  const {
    setModeOfManageCommunityStakeModal,
    modeOfManageCommunityStakeModal,
  } = useManageCommunityStakeModalStore();

  const [selectedCommunity, setSelectedCommunity] =
    // @ts-expect-error <StrictNullChecks/>
    React.useState<ChainInfo>(null);

  const oneDayAgo = useRef(new Date().getTime() - 24 * 60 * 60 * 1000);

  const { data: historicalPrices, isLoading: historicalPriceLoading } =
    trpc.community.getStakeHistoricalPrice.useQuery({
      past_date_epoch: oneDayAgo.current / 1000, // 24 hours ago
    });

  const handleSetFilterMap = (key: string) => {
    setFilterMap((prevState) => ({ ...prevState, [key]: !filterMap[key] }));
  };

  const { data: ethUsdRateData } = useFetchEthUsdRateQuery();
  const ethUsdRate = ethUsdRateData?.data?.data?.amount;

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
          // @ts-expect-error <StrictNullChecks/>
          (!communityToCategoriesMap[data.id] ||
            // @ts-expect-error <StrictNullChecks/>
            !communityToCategoriesMap[data.id].includes(
              cat as CommunityCategoryType,
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

    // @ts-expect-error <StrictNullChecks/>
    const historicalPriceMap: Map<string, string> =
      historicalPriceLoading || !historicalPrices
        ? null
        : new Map(
            Object.entries(
              historicalPrices?.reduce((acc, { community_id, old_price }) => {
                acc[community_id] = old_price;
                return acc;
              }, {}),
            ),
          );

    // Filter by recent thread activity
    const res = filteredList
      .sort((a, b) => {
        const threadCountA = app.recentActivity.getCommunityThreadCount(a.id);
        const threadCountB = app.recentActivity.getCommunityThreadCount(b.id);
        return threadCountB - threadCountA;
      })
      .map((community: CommunityInfo, i) => {
        // allow user to buy stake if they have a connected address that matches this community's base chain
        const canBuyStake = !!app?.user?.addresses?.find?.(
          (address) => address?.community?.base === community?.base,
        );

        return (
          <CWRelatedCommunityCard
            key={i}
            community={community}
            memberCount={community.addressCount}
            threadCount={community.threadCount}
            canBuyStake={canBuyStake}
            onStakeBtnClick={() => setSelectedCommunity(community)}
            ethUsdRate={ethUsdRate}
            historicalPrice={historicalPriceMap?.get(community.id)}
            onlyShowIfStakeEnabled={!!filterMap[STAKE_FILTER_KEY]}
          />
        );
      });

    return res;
  };

  const { data: activeCommunities, isLoading } =
    useFetchActiveCommunitiesQuery();
  const sortedCommunities = activeCommunities
    ? sortCommunities(
        activeCommunities.communities.map((c: any) =>
          CommunityInfo.fromJSON(c),
        ),
      )
    : [];

  return (
    <CWPageLayout>
      <div className="CommunitiesPage">
        <div className="header-section">
            <CommunityLaunchCard onLaunch={(name) => console.log('Community launched:', name)} />          {/* <div className="filters">
            <CWIcon iconName="funnelSimple" />
            <CWButton
              label={STAKE_FILTER_KEY}
              buttonHeight="sm"
              buttonType={filterMap[STAKE_FILTER_KEY] ? 'primary' : 'secondary'}
              onClick={() => {
                handleSetFilterMap(STAKE_FILTER_KEY);
              }}
              iconLeft="coins"
            />
            <CWDivider isVertical />
            {communityCategories.map((cat, i) => {
              return (
                <CWButton
                  key={i}
                  label={cat}
                  buttonHeight="sm"
                  buttonType={filterMap[cat] ? 'primary' : 'secondary'}
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
                  buttonHeight="sm"
                  buttonType={filterMap[network] ? 'primary' : 'secondary'}
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
                  buttonHeight="sm"
                  buttonType={filterMap[base] ? 'primary' : 'secondary'}
                  onClick={() => {
                    handleSetFilterMap(base);
                  }}
                />
              );
            })}
          </div> */}
        </div>
        <div className="trending-header">
          <CWText type="h2" fontWeight="semiBold">
            Trending
          </CWText>
          <CWIcon iconName="dot" iconSize="xxs" />
          <CWText type="caption" className="communities-count">
            {activeCommunities &&
              buildCommunityString(activeCommunities.totalCommunitiesCount)}
          </CWText>
        </div>
        {isLoading ? (
          <CWCircleMultiplySpinner />
        ) : (
          <div className="communities-list">
            {sortedCommunities}
            <NewCommunityCard />
          </div>
        )}
        <CWModal
          size="small"
          content={
            <ManageCommunityStakeModal
              mode={modeOfManageCommunityStakeModal}
              // @ts-expect-error <StrictNullChecks/>
              onModalClose={() => setModeOfManageCommunityStakeModal(null)}
              community={selectedCommunity}
              denomination={
                findDenominationString(selectedCommunity?.id) || 'ETH'
              }
            />
          }
          // @ts-expect-error <StrictNullChecks/>
          onClose={() => setModeOfManageCommunityStakeModal(null)}
          open={!!modeOfManageCommunityStakeModal}
        />
      </div>
    </CWPageLayout>
  );
};

export default CommunitiesPage;
