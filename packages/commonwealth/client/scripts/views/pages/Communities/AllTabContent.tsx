import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { useFetchGlobalActivityQuery } from 'client/scripts/state/api/feeds/fetchUserActivity';
import { useFlag } from 'hooks/useFlag';
import { useCommonNavigate } from 'navigation/helpers';
import React, { MutableRefObject } from 'react';
import useUserStore from 'state/ui/user';
import { z } from 'zod';
import CWSectionHeader from '../../components/component_kit/new_designs/CWSectionHeader';
import TrendingThreadList from '../HomePage/TrendingThreadList/TrendingThreadList';
import XPTable from '../Leaderboard/XPTable/XPTable';
import { TrendingCommunitiesPreview } from '../user_dashboard/TrendingCommunitiesPreview';
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
  fetchMoreCommunities?: () => Promise<void>;
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
  const questsEnabled = useFlag('xp');
  const user = useUserStore();
  const navigate = useCommonNavigate();

  return (
    <>
      {launchpadEnabled && (
        <div className="section-container">
          <CWSectionHeader
            title="Tokens"
            seeAllText="See all tokens"
            onSeeAllClick={() => navigate('/explore?tab=tokens')}
          />
          <TokensList filters={filters} hideHeader />
        </div>
      )}

      {/* Communities section */}
      <div className="section-container">
        <TrendingCommunitiesPreview />
      </div>

      {/* Quests section */}
      {questsEnabled && (
        <div className="section-container">
          <CWSectionHeader
            title="Quests"
            seeAllText="See all quests"
            onSeeAllClick={() => navigate('/explore?tab=quests')}
          />
          <div className="horizontal-scroll-container">
            <QuestList hideHeader />
          </div>
        </div>
      )}

      {/* Contests section */}
      <div className="section-container">
        <CWSectionHeader
          title="Contests"
          seeAllText="See all contests"
          onSeeAllClick={() => navigate('/explore?tab=contests')}
        />
        <div className="horizontal-scroll-container">
          <ExploreContestList hideHeader />
        </div>
      </div>

      {/* Trending Threads section */}
      <div className="section-container">
        <CWSectionHeader
          title="Trending Threads"
          seeAllText="See all threads"
          onSeeAllClick={() => navigate('/explore?tab=threads')}
        />
        <TrendingThreadList
          query={useFetchGlobalActivityQuery}
          customScrollParent={containerRef.current}
          hideHeader
        />
      </div>

      {/* Users section */}
      <div className="section-container">
        <CWSectionHeader
          title="Users"
          seeAllText="See all users"
          onSeeAllClick={() => navigate('/explore?tab=users')}
        />
        <div className="users-xp-table">
          <XPTable />
        </div>
      </div>
    </>
  );
};

export default AllTabContent;
