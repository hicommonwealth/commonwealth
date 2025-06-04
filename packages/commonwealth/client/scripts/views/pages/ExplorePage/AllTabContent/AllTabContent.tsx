import { useFlag } from 'hooks/useFlag';
import { useCommonNavigate } from 'navigation/helpers';
import React, { MutableRefObject } from 'react';
import { useFetchGlobalActivityQuery } from 'state/api/feeds/fetchUserActivity';
import CWSectionHeader from 'views/components/component_kit/new_designs/CWSectionHeader';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import TrendingThreadList from '../../HomePage/TrendingThreadList/TrendingThreadList';
import XPTable from '../../Leaderboard/XPTable/XPTable';
import { TrendingCommunitiesPreview } from '../../user_dashboard/TrendingCommunitiesPreview';
import ExploreContestList from '../ExploreContestList';
import QuestList from '../QuestList';
import TokensList from '../TokensList';
import './AllTabContent.scss';

interface AllTabContentProps {
  containerRef: MutableRefObject<HTMLElement | undefined>;
  searchText?: string;
  onClearSearch?: () => void;
}

const AllTabContent: React.FC<AllTabContentProps> = ({
  containerRef,
  searchText,
  onClearSearch,
}) => {
  const launchpadEnabled = useFlag('launchpad');
  const questsEnabled = useFlag('xp');
  const navigate = useCommonNavigate();

  return (
    <div className="AllTabContent">
      {searchText?.trim() && (
        <CWTag
          label={`Search: ${searchText?.trim()}`}
          type="filter"
          onCloseClick={onClearSearch}
        />
      )}
      {launchpadEnabled && (
        <div className="section-container">
          <CWSectionHeader
            title="Tokens"
            seeAllText="See all tokens"
            onSeeAllClick={() => navigate('/explore?tab=tokens')}
          />
          <TokensList
            hideHeader
            hideFilters
            hideSeeMore
            hideSearchTag
            searchText={searchText}
            onClearSearch={onClearSearch}
          />
        </div>
      )}

      {/* Communities section */}
      <div className="section-container">
        <TrendingCommunitiesPreview
          hideSearchTag
          searchText={searchText}
          onClearSearch={onClearSearch}
        />
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
            <QuestList
              hideHeader
              hideFilters
              hideSeeMore
              hideSearchTag
              searchText={searchText}
              onClearSearch={onClearSearch}
            />
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
          <ExploreContestList
            hideHeader
            hideSearchTag
            searchText={searchText}
            onClearSearch={onClearSearch}
          />
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
          hideSearchTag
          searchText={searchText}
          onClearSearch={onClearSearch}
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
          <XPTable searchText={searchText} onClearSearch={onClearSearch} />
        </div>
      </div>
    </div>
  );
};

export default AllTabContent;
