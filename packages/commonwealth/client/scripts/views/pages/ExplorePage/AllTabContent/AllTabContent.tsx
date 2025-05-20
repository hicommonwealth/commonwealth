import { useFlag } from 'hooks/useFlag';
import { useCommonNavigate } from 'navigation/helpers';
import React, { MutableRefObject } from 'react';
import { useFetchGlobalActivityQuery } from 'state/api/feeds/fetchUserActivity';
import CWSectionHeader from 'views/components/component_kit/new_designs/CWSectionHeader';
import TrendingThreadList from '../../HomePage/TrendingThreadList/TrendingThreadList';
import XPTable from '../../Leaderboard/XPTable/XPTable';
import { TrendingCommunitiesPreview } from '../../user_dashboard/TrendingCommunitiesPreview';
import ExploreContestList from '../ExploreContestList';
import QuestList from '../QuestList';
import TokensList from '../TokensList';
import './AllTabContent.scss';

interface AllTabContentProps {
  containerRef: MutableRefObject<HTMLElement | undefined>;
}

const AllTabContent: React.FC<AllTabContentProps> = ({ containerRef }) => {
  const launchpadEnabled = useFlag('launchpad');
  const questsEnabled = useFlag('xp');
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
          <TokensList hideHeader />
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
