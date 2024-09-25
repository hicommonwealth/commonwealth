import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { ChainBase, ChainNetwork } from '@hicommonwealth/shared';
import { findDenominationString } from 'helpers/findDenomination';
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

type ExtendedCommunityType = z.infer<typeof ExtendedCommunity>;
type ExtendedCommunitySliceType = [
  ExtendedCommunityType,
  ExtendedCommunityType,
];

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
  } = useFetchCommunitiesQuery({
    limit: 50,
    include_node_info: true,
    order_by: 'lifetime_thread_count',
    order_direction: 'DESC',
    base: filters.withChainBase ? ChainBase[filters.withChainBase] : undefined,
    network: filters.withNetwork,
    stake_enabled: filters.withStakeEnabled,
    cursor: 1,
    tag_ids: filters.withTagsIds,
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

  return (
    // @ts-expect-error <StrictNullChecks/>
    <CWPageLayout ref={containerRef} className="CommunitiesPageLayout">
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
        {isLoading && communitiesList.length === 0 ? (
          <CWCircleMultiplySpinner />
        ) : (
          <Virtuoso
            key={`${filters.withChainBase}-${filters.withNetwork}-${filters.withStakeEnabled}-${filters.withTagsIds}`}
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
                <section className="empty-placeholder">
                  <CWText type="h2">
                    No communities found
                    {filters.withChainBase ||
                    filters.withNetwork ||
                    filters.withStakeEnabled ||
                    filters.withTagsIds
                      ? ` for the applied filters.`
                      : '.'}
                    <br />
                    Create a new community <Link to="/communities">here</Link>.
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
