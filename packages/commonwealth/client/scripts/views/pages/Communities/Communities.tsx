import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { ChainNetwork, CommunityType } from '@hicommonwealth/shared';
import clsx from 'clsx';
import { findDenominationString } from 'helpers/findDenomination';
import useBrowserWindow from 'hooks/useBrowserWindow';
import { useFlag } from 'hooks/useFlag';
import React, { Fragment, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { useFetchCommunitiesQuery } from 'state/api/communities';
import { useFetchTagsQuery } from 'state/api/tags';
import { useManageCommunityStakeModalStore } from 'state/ui/modals';
import useUserStore from 'state/ui/user';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { z } from 'zod';
import { useFetchTokenUsdRateQuery } from '../../../state/api/communityStake/index';
import { trpc } from '../../../utils/trpcClient';
import { NewCommunityCard } from '../../components/CommunityCard';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from '../../components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { CWRelatedCommunityCard } from '../../components/component_kit/new_designs/CWRelatedCommunityCard';
import { CWTag } from '../../components/component_kit/new_designs/CWTag';
import CreateCommunityButton from '../../components/sidebar/CreateCommunityButton';
import ManageCommunityStakeModal from '../../modals/ManageCommunityStakeModal/ManageCommunityStakeModal';
import './Communities.scss';
import {
  CommunityFilters,
  CommunitySortDirections,
  CommunitySortOptions,
  FiltersDrawer,
  communityChains,
  communitySortOptionsLabelToKeysMap,
  sortOrderLabelsToDirectionsMap,
} from './FiltersDrawer';
import IdeaLaunchpad from './IdeaLaunchpad';
import TokensList from './TokensList';
import { getCommunityCountsString } from './helpers';

type ExtendedCommunityType = z.infer<typeof ExtendedCommunity>;
type ExtendedCommunitySliceType = [
  ExtendedCommunityType,
  ExtendedCommunityType,
];

const CommunitiesPage = () => {
  const containerRef = useRef();
  const tokenizedCommunityEnabled = useFlag('tokenizedCommunity');

  const {
    setModeOfManageCommunityStakeModal,
    modeOfManageCommunityStakeModal,
  } = useManageCommunityStakeModalStore();

  const [filters, setFilters] = useState<CommunityFilters>({
    withCommunityEcosystem: undefined,
    withStakeEnabled: undefined,
    withTagsIds: undefined,
    withCommunitySortBy: CommunitySortOptions.MemberCount,
    withCommunitySortOrder: CommunitySortDirections.Descending,
    withCommunityType: undefined,
    withEcosystemChainId: undefined,
    withNetwork: undefined,
  });

  const [selectedCommunityId, setSelectedCommunityId] = useState<string>();

  const user = useUserStore();
  const oneDayAgo = useRef(new Date().getTime() - 24 * 60 * 60 * 1000);

  const { data: tags, isLoading: isLoadingTags } = useFetchTagsQuery();

  const { isWindowSmallInclusive } = useBrowserWindow({});

  const {
    data: communities,
    fetchNextPage: fetchMoreCommunities,
    hasNextPage,
    isInitialLoading: isInitialCommunitiesLoading,
  } = useFetchCommunitiesQuery({
    limit: 50,
    include_node_info: true,
    order_by:
      communitySortOptionsLabelToKeysMap[filters.withCommunitySortBy || ''] ||
      'lifetime_thread_count',
    order_direction:
      sortOrderLabelsToDirectionsMap[filters.withCommunitySortOrder || ''] ||
      'DESC',
    eth_chain_id:
      typeof filters.withEcosystemChainId === 'number'
        ? filters.withEcosystemChainId
        : undefined,
    cosmos_chain_id:
      typeof filters.withEcosystemChainId === 'string'
        ? filters.withEcosystemChainId
        : undefined,
    base: filters.withCommunityEcosystem || undefined,
    network: filters.withNetwork
      ? ChainNetwork[filters.withNetwork]
      : undefined,
    stake_enabled: filters.withStakeEnabled,
    cursor: 1,
    tag_ids: filters.withTagsIds,
    community_type: filters.withCommunityType
      ? CommunityType[filters.withCommunityType]
      : undefined,
  });

  const { data: historicalPrices, isLoading: isLoadingHistoricalPrices } =
    trpc.community.getStakeHistoricalPrice.useQuery({
      past_date_epoch: oneDayAgo.current / 1000, // 24 hours ago
    });

  const { data: ethUsdRateData, isLoading: isLoadingEthUsdRate } =
    useFetchTokenUsdRateQuery({
      tokenSymbol: 'ETH',
    });
  const ethUsdRate = ethUsdRateData?.data?.data?.amount;

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const isLoading =
    isLoadingTags ||
    isInitialCommunitiesLoading ||
    isLoadingHistoricalPrices ||
    isLoadingEthUsdRate;

  const communitiesList = useMemo(() => {
    const flatList = (communities?.pages || []).flatMap((page) => page.results);

    const SLICE_SIZE = 2;
    const twoCommunitiesPerEntry: ExtendedCommunitySliceType[] = [];

    for (let i = 0; i < flatList.length; i += SLICE_SIZE) {
      twoCommunitiesPerEntry.push(
        flatList.slice(i, i + SLICE_SIZE) as ExtendedCommunitySliceType,
      );
    }

    return twoCommunitiesPerEntry;
  }, [communities?.pages]);

  const removeStakeFilter = () => {
    setFilters({
      ...filters,
      withStakeEnabled: false,
    });
  };

  const removeTagFilter = (tagId: number) => {
    setFilters({
      ...filters,
      withTagsIds: [...(filters.withTagsIds || [])].filter(
        (id) => tagId !== id,
      ),
    });
  };

  const removeCommunityEcosystemFilter = () => {
    setFilters({
      ...filters,
      withCommunityEcosystem: undefined,
    });
  };

  const removeEcosystemChainIdFilter = () => {
    setFilters({
      ...filters,
      withEcosystemChainId: undefined,
    });
  };

  const removeChainNetworkFilter = () => {
    setFilters({
      ...filters,
      withNetwork: undefined,
    });
  };

  const removeCommunityTypeFilter = () => {
    setFilters({
      ...filters,
      withCommunityType: undefined,
    });
  };

  const removeCommunitySortByFilter = () => {
    setFilters({
      ...filters,
      withCommunitySortBy: undefined,
      withCommunitySortOrder: undefined,
    });
  };

  const communitiesCount = (
    <CWText type="b2" className="communities-count">
      {!isLoading && communities?.pages?.[0]?.totalResults
        ? getCommunityCountsString(communities?.pages?.[0]?.totalResults)
        : 'No communities found'}
    </CWText>
  );

  return (
    // @ts-expect-error <StrictNullChecks/>
    <CWPageLayout ref={containerRef} className="CommunitiesPageLayout">
      <div className="CommunitiesPage">
        <div className="header-section">
          <div className="description">
            <CWText
              type="h1"
              {...(tokenizedCommunityEnabled && { fontWeight: 'semiBold' })}
            >
              Explore {tokenizedCommunityEnabled ? '' : 'Communities'}
            </CWText>
            {isWindowSmallInclusive ? communitiesCount : <></>}
            <div className="actions">
              {!isWindowSmallInclusive ? communitiesCount : <></>}
              <CWButton
                label="Filters"
                iconRight="funnelSimple"
                buttonType="secondary"
                onClick={() => setIsFilterDrawerOpen((isOpen) => !isOpen)}
              />
              <CreateCommunityButton buttonHeight="med" withIcon />
            </div>
          </div>
          <div
            className={clsx('filters', {
              hasAppliedFilter:
                Object.values(filters).filter(Boolean).length === 1
                  ? !filters.withCommunitySortOrder
                  : Object.values(filters).filter(Boolean).length > 0,
            })}
          >
            {filters.withCommunitySortBy && (
              <CWTag
                label={`${filters.withCommunitySortBy}${
                  filters.withCommunitySortOrder &&
                  filters.withCommunitySortBy !==
                    CommunitySortOptions.MostRecent
                    ? ` : ${filters.withCommunitySortOrder}`
                    : ''
                }
                `}
                type="filter"
                onCloseClick={removeCommunitySortByFilter}
              />
            )}
            {filters.withCommunityType && (
              <CWTag
                label={filters.withCommunityType}
                type="filter"
                onCloseClick={removeCommunityTypeFilter}
              />
            )}
            {filters.withNetwork && (
              <CWTag
                label={filters.withNetwork}
                type="filter"
                onCloseClick={removeChainNetworkFilter}
              />
            )}
            {filters.withCommunityEcosystem && (
              <CWTag
                label={filters.withCommunityEcosystem}
                type="filter"
                onCloseClick={removeCommunityEcosystemFilter}
              />
            )}
            {filters.withEcosystemChainId && (
              <CWTag
                label={
                  Object.entries(communityChains).find(
                    ([_, v]) => filters.withEcosystemChainId === v,
                  )?.[0] as string
                }
                type="filter"
                onCloseClick={removeEcosystemChainIdFilter}
              />
            )}
            {filters.withStakeEnabled && (
              <CWTag
                label="Stake"
                type="filter"
                onCloseClick={removeStakeFilter}
              />
            )}
            {filters.withTagsIds &&
              filters.withTagsIds.map((id) => (
                <CWTag
                  key={id}
                  type="filter"
                  label={(tags || []).find((t) => t.id === id)?.name || ''}
                  onCloseClick={() => removeTagFilter(id)}
                />
              ))}
            <FiltersDrawer
              isOpen={isFilterDrawerOpen}
              onClose={() => setIsFilterDrawerOpen(false)}
              filters={filters}
              onFiltersChange={(newFilters) => setFilters(newFilters)}
            />
          </div>

          <IdeaLaunchpad />
        </div>
        <TokensList />
        {tokenizedCommunityEnabled && <CWText type="h2">Communities</CWText>}
        {isLoading && communitiesList.length === 0 ? (
          <CWCircleMultiplySpinner />
        ) : (
          <Virtuoso
            key={Object.values(filters)
              .map((v) => `${v}`)
              .join('-')}
            className="communities-list"
            style={{ height: '100%', width: '100%' }}
            data={isInitialCommunitiesLoading ? [] : communitiesList}
            customScrollParent={containerRef.current}
            itemContent={(listIndex, slicedCommunities) => {
              return slicedCommunities.map((community, sliceIndex) => {
                const canBuyStake = !!user.addresses.find?.(
                  (address) => address?.community?.base === community?.base,
                );

                const historicalPriceMap: Map<string, string> = new Map(
                  Object.entries(
                    (historicalPrices || [])?.reduce(
                      (acc, { community_id, old_price }) => {
                        acc[community_id] = old_price;
                        return acc;
                      },
                      {},
                    ),
                  ),
                );

                return (
                  <Fragment key={community.id}>
                    <CWRelatedCommunityCard
                      community={community}
                      memberCount={community.profile_count || 0}
                      threadCount={community.lifetime_thread_count || 0}
                      canBuyStake={canBuyStake}
                      onStakeBtnClick={() =>
                        setSelectedCommunityId(community?.id || '')
                      }
                      ethUsdRate={ethUsdRate}
                      {...(historicalPriceMap &&
                        community.id && {
                          historicalPrice: historicalPriceMap?.get(
                            community.id,
                          ),
                        })}
                      onlyShowIfStakeEnabled={!!filters.withStakeEnabled}
                    />
                    {listIndex === communitiesList.length - 1 &&
                      sliceIndex === slicedCommunities.length - 1 && (
                        <NewCommunityCard />
                      )}
                  </Fragment>
                );
              });
            }}
            endReached={() => {
              hasNextPage && fetchMoreCommunities().catch(console.error);
            }}
            overscan={50}
            components={{
              // eslint-disable-next-line react/no-multi-comp
              EmptyPlaceholder: () => (
                <section
                  className={clsx('empty-placeholder', {
                    'my-16': tokenizedCommunityEnabled,
                  })}
                >
                  <CWText type="h2">
                    No communities found
                    {filters.withCommunityEcosystem ||
                    filters.withNetwork ||
                    filters.withStakeEnabled ||
                    filters.withTagsIds
                      ? ` for the applied filters.`
                      : '.'}
                    <br />
                    Create a new community{' '}
                    <Link to="/createCommunity">here</Link>.
                  </CWText>
                </section>
              ),
            }}
          />
        )}
        <CWModal
          size="small"
          content={
            <ManageCommunityStakeModal
              mode={modeOfManageCommunityStakeModal}
              // @ts-expect-error <StrictNullChecks/>
              onModalClose={() => setModeOfManageCommunityStakeModal(null)}
              denomination={
                findDenominationString(selectedCommunityId || '') || 'ETH'
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
