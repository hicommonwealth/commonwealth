import { CWTag } from 'client/scripts/views/components/component_kit/new_designs/CWTag';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { Link } from 'react-router-dom';
import { useFetchCommunitiesQuery } from 'state/api/communities';
import { useGetNewContent } from 'state/api/user';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
import { CWIcon } from '../../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../../components/component_kit/cw_text';
import { CommunityPreviewCard } from './CommunityPreviewCard';
import './TrendingCommunitiesPreview.scss';

type TrendingCommunitiesPreviewProps = {
  searchText?: string;
  onClearSearch?: () => void;
  hideSearchTag?: boolean;
};

export const TrendingCommunitiesPreview = ({
  searchText,
  onClearSearch,
  hideSearchTag,
}: TrendingCommunitiesPreviewProps) => {
  const navigate = useCommonNavigate();
  const user = useUserStore();

  const { data: newContent } = useGetNewContent({ enabled: !!user.isLoggedIn });
  const { data: paginatedTrendingCommunities } = useFetchCommunitiesQuery({
    cursor: 1,
    limit: 3,
    ...(user.isLoggedIn && {
      relevance_by: 'membership',
    }),
    search: searchText?.trim(),
    include_last_30_day_thread_count: true,
    order_by: 'last_30_day_thread_count',
    order_direction: 'DESC',
  });

  const trendingCommunities = (
    paginatedTrendingCommunities?.pages?.[0]?.results || []
  )
    .map((community) => ({
      community,
      isMember: Permissions.isCommunityMember(community.id),
      hasNewContent: (
        newContent?.joinedCommunityIdsWithNewContent || []
      ).includes(community.id || ''),
      onClick: () => navigate(`/${community.id}`),
    }))
    .sort((a, b) => {
      // display user-joined communities with new content first
      if (a.hasNewContent) return -1;
      if (b.hasNewContent) return 1;

      return (
        (b.community.last_30_day_thread_count || 0) -
        (a.community.last_30_day_thread_count || 0)
      );
    });

  return (
    <div className="TrendingCommunitiesPreview">
      <div className="heading-container">
        <CWText type="h2">Trending Communities</CWText>
        <Link to="/explore?tab=communities">
          <div className="link-right">
            <CWText className="link">See all</CWText>
            <CWIcon iconName="arrowRightPhosphor" className="blue-icon" />
          </div>
        </Link>
      </div>
      <div className="filters">
        {!hideSearchTag && searchText?.trim() && (
          <CWTag
            label={`Search: ${searchText?.trim()}`}
            type="filter"
            onCloseClick={onClearSearch}
          />
        )}
      </div>
      <div className="community-preview-cards-collection">
        {trendingCommunities.map((sortedCommunity) => (
          <CommunityPreviewCard
            key={sortedCommunity.community.id}
            community={{
              name: sortedCommunity.community.name || '',
              icon_url: sortedCommunity.community.icon_url || '',
              id: sortedCommunity.community.id || '',
              base: sortedCommunity.community.base || '',
              tier: sortedCommunity.community.tier,
            }}
            monthlyThreadCount={
              sortedCommunity.community.last_30_day_thread_count || 0
            }
            isCommunityMember={sortedCommunity.isMember}
            hasNewContent={sortedCommunity.hasNewContent}
            onClick={sortedCommunity.onClick}
          />
        ))}
        <CommunityPreviewCard
          isExploreMode
          customExploreText="Create Your Community"
          onClick={() => {
            navigate('/createCommunity');
          }}
        />
      </div>
    </div>
  );
};
