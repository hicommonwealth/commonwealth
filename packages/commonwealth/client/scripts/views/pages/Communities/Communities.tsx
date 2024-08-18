import { ChainBase, ChainNetwork } from '@hicommonwealth/shared';
import { findDenominationString } from 'helpers/findDenomination';
import React, { Fragment, useMemo, useRef, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useFetchTagsQuery } from 'state/api/tags';
import { useManageCommunityStakeModalStore } from 'state/ui/modals';
import useUserStore from 'state/ui/user';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { useFetchEthUsdRateQuery } from '../../../state/api/communityStake/index';
import { trpc } from '../../../utils/trpcClient';
import { NewCommunityCard } from '../../components/CommunityCard';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from '../../components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { CWRelatedCommunityCard } from '../../components/component_kit/new_designs/CWRelatedCommunityCard';
import CreateCommunityButton from '../../components/sidebar/CreateCommunityButton';
import ManageCommunityStakeModal from '../../modals/ManageCommunityStakeModal/ManageCommunityStakeModal';
import './Communities.scss';
import { getCommunityCountsString } from './helpers';

const communityNetworks: string[] = Object.keys(ChainNetwork).filter(
  (val) => val === 'ERC20',
); // We only are allowing ERC20 for now

const communityBases = Object.keys(ChainBase) as ChainBase[];

const CommunitiesPage = () => {
  const containerRef = useRef();

  const {
    setModeOfManageCommunityStakeModal,
    modeOfManageCommunityStakeModal,
  } = useManageCommunityStakeModalStore();

  const [filters, setFilters] = useState<{
    withNetwork?: ChainNetwork;
    withChainBase?: ChainBase;
    withStakeEnabled?: boolean;
    withTagsIds?: number[];
  }>({
    withChainBase: undefined,
    withStakeEnabled: undefined,
    withTagsIds: undefined,
  });

  const [selectedCommunityId, setSelectedCommunityId] = useState<string>();

  const user = useUserStore();
  const oneDayAgo = useRef(new Date().getTime() - 24 * 60 * 60 * 1000);

  const { data: tags, isLoading: isLoadingTags } = useFetchTagsQuery();

  const {
    data: communities,
    fetchNextPage: fetchMoreCommunities,
    hasNextPage,
    isInitialLoading: isInitialCommunitiesLoading,
  } = trpc.community.getCommunities.useInfiniteQuery(
    {
      limit: 50,
      include_node_info: true,
      order_by: 'thread_count',
      order_direction: 'DESC',
      base: filters.withChainBase
        ? ChainBase[filters.withChainBase]
        : undefined,
      network: filters.withNetwork,
      stake_enabled: filters.withStakeEnabled,
      ...(filters.withTagsIds &&
        filters.withTagsIds?.length > 0 && {
          tag_ids: filters.withTagsIds.join(','),
        }),
    },
    {
      staleTime: 60 * 3_000,
      enabled: true,
      initialCursor: 1,
      getNextPageParam: (lastPage) => {
        const nextPageNum = lastPage.page + 1;
        if (nextPageNum <= lastPage.totalPages) return nextPageNum;
        return undefined;
      },
    },
  );

  const { data: historicalPrices, isLoading: isLoadingHistoricalPrices } =
    trpc.community.getStakeHistoricalPrice.useQuery({
      past_date_epoch: oneDayAgo.current / 1000, // 24 hours ago
    });

  const { data: ethUsdRateData, isLoading: isLoadingEthUsdRate } =
    useFetchEthUsdRateQuery();
  const ethUsdRate = ethUsdRateData?.data?.data?.amount;

  const isLoading =
    isLoadingTags ||
    isInitialCommunitiesLoading ||
    isLoadingHistoricalPrices ||
    isLoadingEthUsdRate;

  const communitiesList = useMemo(() => {
    const flatList = (communities?.pages || []).flatMap((page) => page.results);

    const SLICE_SIZE = 2;
    const twoCommunitiesPerEntry: any = [];

    for (let i = 0; i < flatList.length; i += SLICE_SIZE) {
      twoCommunitiesPerEntry.push(flatList.slice(i, i + SLICE_SIZE));
    }

    return twoCommunitiesPerEntry;
  }, [communities?.pages]);

  return (
    // @ts-expect-error <StrictNullChecks/>
    <CWPageLayout ref={containerRef}>
      <div className="CommunitiesPage">
        <div className="header-section">
          <div className="description">
            <CWText type="h2" fontWeight="semiBold">
              Explore communities
            </CWText>
            <div className="actions">
              <CWText type="caption" className="communities-count">
                {!isLoading && communities?.pages?.[0]?.totalResults
                  ? getCommunityCountsString(
                      communities?.pages?.[0]?.totalResults,
                    )
                  : 'No communities found'}
              </CWText>
              <CreateCommunityButton />
            </div>
          </div>
          <div className="filters">
            <CWIcon iconName="funnelSimple" />
            <CWButton
              label="Stake"
              buttonHeight="sm"
              buttonType={filters.withStakeEnabled ? 'primary' : 'secondary'}
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  withStakeEnabled: !f.withStakeEnabled,
                }))
              }
              iconLeft="coins"
            />
            <CWDivider isVertical />
            {(tags || [])
              .filter((t) => ['dao', 'defi'].includes(t.name.toLowerCase()))
              .map((tag) => {
                return (
                  <CWButton
                    key={tag.name}
                    label={tag.name}
                    buttonHeight="sm"
                    buttonType={
                      filters.withTagsIds?.includes(tag.id)
                        ? 'primary'
                        : 'secondary'
                    }
                    onClick={() => {
                      setFilters((f) => ({
                        ...f,
                        withTagsIds: (f.withTagsIds || [])?.includes(tag.id)
                          ? [...(f.withTagsIds || [])].filter(
                              (id) => id !== tag.id,
                            )
                          : [...(f.withTagsIds || []), tag.id],
                      }));
                    }}
                  />
                );
              })}
            <CWDivider isVertical />
            {communityNetworks.map((network) => {
              return (
                <CWButton
                  key={network}
                  label={network}
                  buttonHeight="sm"
                  buttonType={
                    filters.withNetwork === ChainNetwork[network]
                      ? 'primary'
                      : 'secondary'
                  }
                  onClick={() => {
                    setFilters((f) => ({
                      ...f,
                      withNetwork:
                        filters.withNetwork === ChainNetwork[network]
                          ? undefined
                          : ChainNetwork[network],
                    }));
                  }}
                />
              );
            })}
            <CWDivider isVertical />
            {/* TODO: 2617 not allowing to filter by multiple bases, do we really need that? */}
            {communityBases.map((base) => {
              return (
                <CWButton
                  key={base}
                  label={base}
                  buttonHeight="sm"
                  buttonType={
                    filters.withChainBase === base ? 'primary' : 'secondary'
                  }
                  onClick={() => {
                    setFilters((f) => ({
                      ...f,
                      withChainBase:
                        f.withChainBase === base ? undefined : base,
                    }));
                  }}
                />
              );
            })}
          </div>
        </div>
        {isLoading || communitiesList.length === 0 ? (
          <CWCircleMultiplySpinner />
        ) : (
          <Virtuoso
            className="communities-list-v"
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
                      threadCount={community.thread_count || 0}
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
              // TODO: 2617 bug, called infinitely
              // hasNextPage && fetchMoreCommunities();
            }}
            overscan={50}
            components={{
              // eslint-disable-next-line react/no-multi-comp
              EmptyPlaceholder: () => (
                <>
                  {/* TODO: 2617 better not found state */}
                  <CWText>
                    No communities found
                    {filters.withChainBase ||
                    filters.withNetwork ||
                    filters.withStakeEnabled ||
                    filters.withTagsIds
                      ? ` for the applied filters`
                      : ''}
                  </CWText>
                  <NewCommunityCard />
                </>
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
