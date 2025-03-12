import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { useFetchGlobalActivityQuery } from 'client/scripts/state/api/feeds/fetchUserActivity';
import clsx from 'clsx';
import { useFlag } from 'hooks/useFlag';
import { useCommonNavigate } from 'navigation/helpers';
import React, { Fragment, MutableRefObject } from 'react';
import { Link } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import useUserStore from 'state/ui/user';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { z } from 'zod';
import { NewCommunityCard } from '../../components/CommunityCard';
import { CWText } from '../../components/component_kit/cw_text';
import CWCircleMultiplySpinner from '../../components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWRelatedCommunityCard } from '../../components/component_kit/new_designs/CWRelatedCommunityCard';
import TrendingThreadList from '../HomePage/TrendingThreadList/TrendingThreadList';
import { XPEarningsTable } from '../RewardsPage/tables/XPEarningsTable';
import ExploreContestList from './ExploreContestList';
import { CommunityFilters } from './FiltersDrawer';
import QuestList from './QuestList';
import TokensList from './TokensList';

import './AllTabContent.scss';

type ExtendedCommunityType = z.infer<typeof ExtendedCommunity>;
type ExtendedCommunitySliceType = [
  ExtendedCommunityType,
  ExtendedCommunityType,
];

interface AllTabContentProps {
  isLoading: boolean;
  isInitialCommunitiesLoading: boolean;
  communitiesList: ExtendedCommunitySliceType[];
  containerRef: MutableRefObject<HTMLElement | undefined>;
  filters: CommunityFilters;
  historicalPrices:
    | { community_id: string; old_price?: string | null }[]
    | undefined;
  ethUsdRate: number;
  setSelectedCommunityId: (id: string) => void;
  hasNextPage?: boolean;
  fetchMoreCommunities?: any;
  hideHeader?: boolean;
}

const AllTabContent: React.FC<AllTabContentProps> = ({
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
  hideHeader = false,
}) => {
  const launchpadEnabled = useFlag('launchpad');
  const user = useUserStore();
  const navigate = useCommonNavigate();

  return (
    <>
      {launchpadEnabled && (
        <div className="section-container">
          <div className="heading-container">
            <CWText type="h2">Tokens</CWText>
            <div
              className="link-right"
              onClick={() => navigate('/explore?tab=tokens')}
            >
              <CWText className="link">See all tokens</CWText>
              <CWIcon iconName="arrowRightPhosphor" className="blue-icon" />
            </div>
          </div>
          <TokensList filters={filters} hideHeader />
        </div>
      )}

      {/* Quests section */}
      <div className="section-container">
        <div className="heading-container">
          <CWText type="h2">Quests</CWText>
          <div
            className="link-right"
            onClick={() => navigate('/explore?tab=quests')}
          >
            <CWText className="link">See all quests</CWText>
            <CWIcon iconName="arrowRightPhosphor" className="blue-icon" />
          </div>
        </div>
        <div className="horizontal-scroll-container">
          <QuestList hideHeader />
        </div>
      </div>

      {/* Contests section */}
      <div className="section-container">
        <div className="heading-container">
          <CWText type="h2">Contests</CWText>
          <div
            className="link-right"
            onClick={() => navigate('/explore?tab=contests')}
          >
            <CWText className="link">See all contests</CWText>
            <CWIcon iconName="arrowRightPhosphor" className="blue-icon" />
          </div>
        </div>
        <div className="horizontal-scroll-container">
          <ExploreContestList hideHeader />
        </div>
      </div>

      {/* Trending Threads section */}
      <div className="section-container">
        <div className="heading-container">
          <CWText type="h2">Trending Threads</CWText>
          <div
            className="link-right"
            onClick={() => navigate('/explore?tab=threads')}
          >
            <CWText className="link">See all threads</CWText>
            <CWIcon iconName="arrowRightPhosphor" className="blue-icon" />
          </div>
        </div>
        <TrendingThreadList
          query={useFetchGlobalActivityQuery}
          customScrollParent={containerRef.current}
          hideHeader
        />
      </div>

      {/* Users section */}
      <div className="section-container">
        <div className="heading-container">
          <CWText type="h2">Users</CWText>
          <div
            className="link-right"
            onClick={() => navigate('/explore?tab=users')}
          >
            <CWText className="link">See all users</CWText>
            <CWIcon iconName="arrowRightPhosphor" className="blue-icon" />
          </div>
        </div>
        <div className="users-xp-table">
          <XPEarningsTable />
        </div>
      </div>

      {/* Communities section */}
      <div className="section-container">
        {launchpadEnabled && !hideHeader && (
          <div className="heading-container">
            <CWText type="h2">Communities</CWText>
            <div
              className="link-right"
              onClick={() => navigate('/explore?tab=communities')}
            >
              <CWText className="link">See all communities</CWText>
              <CWIcon iconName="arrowRightPhosphor" className="blue-icon" />
            </div>
          </div>
        )}

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
              });
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
      </div>
    </>
  );
};

export default AllTabContent;
