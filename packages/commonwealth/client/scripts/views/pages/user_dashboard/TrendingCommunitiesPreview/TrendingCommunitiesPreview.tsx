import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import app from 'state';
import { CWButton } from '../../../components/component_kit/cw_button';
import { CWText } from '../../../components/component_kit/cw_text';
import { CommunityPreviewCard } from './CommunityPreviewCard';
import './TrendingCommunitiesPreview.scss';

export const TrendingCommunitiesPreview = () => {
  const navigate = useCommonNavigate();

  const sortedCommunities = app.config.chains
    .getAll()
    .sort((a, b) => {
      const threadCountA = app.recentActivity.getCommunityThreadCount(a.id);
      const threadCountB = app.recentActivity.getCommunityThreadCount(b.id);
      return threadCountB - threadCountA;
    })
    .map((community, i) => {
      const monthlyThreadCount = app.recentActivity.getCommunityThreadCount(
        community.id,
      );
      const isMember = app.roles.isMember({
        account: app.user.activeAccount,
        community: community.id,
      });
      const { unseenPosts } = app.user;
      const hasVisitedCommunity = !!unseenPosts[community.id];

      return (
        <CommunityPreviewCard
          key={i}
          community={community}
          monthlyThreadCount={monthlyThreadCount}
          isCommunityMember={isMember}
          hasUnseenPosts={app.isLoggedIn() && !hasVisitedCommunity}
          onClick={() => {
            navigate(`/${community.id}`);
          }}
        />
      );
    });

  return (
    <div className="TrendingCommunitiesPreview">
      <CWText type="h4" className="header">
        Trending Communities
      </CWText>
      <div className="community-preview-cards-collection">
        {sortedCommunities.length > 3
          ? sortedCommunities.slice(0, 3)
          : sortedCommunities}
      </div>
      <div className="buttons">
        <CWButton
          onClick={() => {
            navigate('/communities');
          }}
          label="Explore communities"
          buttonType="mini-black"
        />
      </div>
    </div>
  );
};
