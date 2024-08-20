import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { useFetchCommunitiesQuery } from 'state/api/communities';
import { useGetNewContent } from 'state/api/user';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
import { CWText } from '../../../components/component_kit/cw_text';
import { CommunityPreviewCard } from './CommunityPreviewCard';
import './TrendingCommunitiesPreview.scss';

export const TrendingCommunitiesPreview = () => {
  const navigate = useCommonNavigate();
  const user = useUserStore();

  const { data: newContent } = useGetNewContent({ enabled: user.isLoggedIn });
  const { data: paginatedTrendingCommunities } = useFetchCommunitiesQuery({
    cursor: 1,
    limit: 3,
    ...(user.isLoggedIn && {
      relevance_by: 'membership',
    }),
    include_last_30_day_thread_count: true,
    order_by: 'last_30_day_thread_count',
    order_direction: 'DESC',
  });

  const trendingCommunities = (
    paginatedTrendingCommunities?.pages?.[0]?.results || []
  )
    .filter((community) => {
      // TODO: This XSS logic should be moved to API + we shouldn't allow users to choose community
      // names with invalid chars
      const name = community.name.toLowerCase();
      //this filter is meant to not include any de facto communities that are actually xss attempts.
      //It's a way of keeping the front facing parts of the app clean looking for users
      return (
        !['"', '>', '<', "'", '/', '`'].includes(name[0]) &&
        !['"', '>', '<', "'", '/', '`'].includes(name[1])
      );
    })
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
      <CWText type="h4" className="header">
        Trending Communities
      </CWText>
      <div className="community-preview-cards-collection">
        {trendingCommunities.map((sortedCommunity, index) => (
          <CommunityPreviewCard
            key={index}
            community={{
              name: sortedCommunity.community.name || '',
              icon_url: sortedCommunity.community.icon_url || '',
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
          onClick={() => {
            navigate('/communities');
          }}
        />
      </div>
    </div>
  );
};
