import { Community } from '@hicommonwealth/schemas';
import clsx from 'clsx';
import { useFlag } from 'hooks/useFlag';
import React, { Fragment, MutableRefObject } from 'react';
import { Link } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import useUserStore from 'state/ui/user';
import { z } from 'zod';
import { NewCommunityCard } from '../../components/CommunityCard';
import { CWText } from '../../components/component_kit/cw_text';
import CWCircleMultiplySpinner from '../../components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWRelatedCommunityCard } from '../../components/component_kit/new_designs/CWRelatedCommunityCard';
import { CommunityFilters } from './FiltersDrawer';

// Define local types (assuming Community is imported or available)
type CommunityItem = z.infer<typeof Community>; // Need to ensure Community is imported/available
type CommunityPair = [CommunityItem, CommunityItem | undefined];

interface CommunitiesTabContentProps {
  isLoading: boolean;
  isInitialCommunitiesLoading: boolean;
  communitiesList: CommunityPair[];
  containerRef: MutableRefObject<HTMLElement | undefined>;
  filters: CommunityFilters;
  historicalPrices?:
    | { community_id: string; old_price?: string | null }[]
    | undefined;
  ethUsdRate: number;
  setSelectedCommunityId: (id: string) => void;
  hasNextPage?: boolean;
  fetchMoreCommunities?: () => Promise<void>;
}

const CommunitiesTabContent = ({
  isLoading,
  isInitialCommunitiesLoading,
  communitiesList,
  containerRef,
  filters,
  historicalPrices,
  ethUsdRate,
  setSelectedCommunityId,
  hasNextPage,
  fetchMoreCommunities,
}: CommunitiesTabContentProps) => {
  const launchpadEnabled = useFlag('launchpad');
  const user = useUserStore();

  return (
    <>
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
            return slicedCommunities
              .map((community, sliceIndex) => {
                if (!community) {
                  return null;
                }

                // Map historical prices using the original approach
                const historicalPriceMap: Map<string, string | undefined> =
                  new Map(
                    Object.entries(
                      (historicalPrices || [])?.reduce(
                        (
                          acc: Record<string, string | undefined>,
                          { community_id, old_price },
                        ) => {
                          acc[community_id] = old_price || undefined;
                          return acc;
                        },
                        {},
                      ),
                    ),
                  );

                // Use the original canBuyStake logic
                const canBuyStake = !!user.addresses.find?.(
                  (address) => address?.community?.base === community?.base,
                );

                return (
                  <Fragment
                    key={community.id || `community-${listIndex}-${sliceIndex}`}
                  >
                    <CWRelatedCommunityCard
                      community={community}
                      memberCount={community.profile_count || 0}
                      threadCount={community.lifetime_thread_count || 0}
                      canBuyStake={canBuyStake}
                      onStakeBtnClick={() =>
                        setSelectedCommunityId(community?.id || '')
                      }
                      ethUsdRate={ethUsdRate.toString()}
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
              })
              .filter(Boolean);
          }}
          endReached={() => {
            hasNextPage && fetchMoreCommunities?.().catch(console.error);
          }}
          overscan={50}
          components={{
            // eslint-disable-next-line react/no-multi-comp
            EmptyPlaceholder: () => (
              <section
                className={clsx('empty-placeholder', {
                  'my-16': launchpadEnabled,
                })}
              >
                <CWText type="h2">
                  No communities found
                  {filters.withCommunityEcosystem ||
                  filters.withNetwork ||
                  filters.withStakeEnabled ||
                  (filters.withTagsIds && filters.withTagsIds.length > 0) ||
                  filters.withCommunityType
                    ? ` for the applied filters.`
                    : '.'}
                  <br />
                  Create a new community <Link to="/createCommunity">here</Link>
                  .
                </CWText>
              </section>
            ),
          }}
        />
      )}
    </>
  );
};

export default CommunitiesTabContent;
