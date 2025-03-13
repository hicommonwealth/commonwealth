import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { useFetchGlobalActivityQuery } from 'client/scripts/state/api/feeds/fetchUserActivity';
import { useFlag } from 'hooks/useFlag';
import { useCommonNavigate } from 'navigation/helpers';
import React, { MutableRefObject } from 'react';
import useUserStore from 'state/ui/user';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { z } from 'zod';
import { CWText } from '../../components/component_kit/cw_text';
import TrendingThreadList from '../HomePage/TrendingThreadList/TrendingThreadList';
import { XPEarningsTable } from '../RewardsPage/tables/XPEarningsTable';
import { TrendingCommunitiesPreview } from '../user_dashboard/TrendingCommunitiesPreview/TrendingCommunitiesPreview';
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

      {/* Communities section */}
      <div className="section-container">
        <TrendingCommunitiesPreview />
      </div>

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
    </>
  );
};

export default AllTabContent;
