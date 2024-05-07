import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import app from 'state';
import { CWText } from '../../../components/component_kit/cw_text';
import { CommunityPreviewCard } from './CommunityPreviewCard';
import './TrendingCommunitiesPreview.scss';

export const TrendingCommunitiesPreview = () => {
  const navigate = useCommonNavigate();

  const sortedCommunities = app.config.chains
    .getAll()
    .filter((community) => {
      const name = community.name.toLowerCase();
      return (
        !['"', '>', '<'].includes(name[0]) && !['"', '>', '<'].includes(name[1])
      );
    })
    .sort((a, b) => {
      const threadCountA = app.recentActivity.getCommunityThreadCount(a.id);
      const threadCountB = app.recentActivity.getCommunityThreadCount(b.id);
      return threadCountB - threadCountA;
    })
    .map((community) => {
      const monthlyThreadCount = app.recentActivity.getCommunityThreadCount(
        community.id,
      );
      const isMember = app.roles.isMember({
        account: app.user.activeAccount,
        community: community.id,
      });
      const { unseenPosts } = app.user;
      const hasVisitedCommunity = !!unseenPosts[community.id];

      return {
        community,
        monthlyThreadCount,
        isMember,
        hasUnseenPosts: app.isLoggedIn() && !hasVisitedCommunity,
        onClick: () => navigate(`/${community.id}`),
      };
    });

  return (
    <div className="TrendingCommunitiesPreview">
      <CWText type="h4" className="header">
        Trending Communities
      </CWText>
      <div className="community-preview-cards-collection">
        {(sortedCommunities.length > 3
          ? sortedCommunities.slice(0, 3)
          : sortedCommunities
        ).map((sortedCommunity, index) => (
          <CommunityPreviewCard
            key={index}
            community={sortedCommunity.community}
            monthlyThreadCount={sortedCommunity.monthlyThreadCount}
            isCommunityMember={sortedCommunity.isMember}
            hasUnseenPosts={sortedCommunity.hasUnseenPosts}
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
