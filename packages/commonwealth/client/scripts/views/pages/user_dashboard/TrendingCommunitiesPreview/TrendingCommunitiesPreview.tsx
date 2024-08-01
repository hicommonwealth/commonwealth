import useUserLoggedIn from 'client/scripts/hooks/useUserLoggedIn';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import app from 'state';
import Permissions from 'utils/Permissions';
import { trpc } from '../../../../utils/trpcClient';
import { CWText } from '../../../components/component_kit/cw_text';
import { CommunityPreviewCard } from './CommunityPreviewCard';
import './TrendingCommunitiesPreview.scss';

export const TrendingCommunitiesPreview = () => {
  const navigate = useCommonNavigate();
  const { isLoggedIn } = useUserLoggedIn();

  const { data } = trpc.user.getCommunitiesWithNewContent.useQuery(
    {},
    {
      enabled: isLoggedIn,
    },
  );

  const sortedCommunities = app.config.chains
    .getAll()
    .filter((community) => {
      const name = community.name.toLowerCase();
      //this filter is meant to not include any de facto communities that are actually xss attempts.
      //It's a way of keeping the front facing parts of the app clean looking for users
      return (
        !['"', '>', '<', "'", '/', '`'].includes(name[0]) &&
        !['"', '>', '<', "'", '/', '`'].includes(name[1])
      );
    })
    .map((community) => {
      const monthlyThreadCount = app.recentActivity.getCommunityThreadCount(
        community.id,
      );
      const isMember = Permissions.isCommunityMember(community.id);

      return {
        community,
        monthlyThreadCount,
        isMember,
        // TODO: should we remove the new label once user visits the community? -- ask from product
        hasNewContent: (data?.joinedCommunityIdsWithNewContent || []).includes(
          community.id,
        ),
        threadCount: app.recentActivity.getCommunityThreadCount(community.id),
        onClick: () => navigate(`/${community.id}`),
      };
    })
    .sort((a, b) => {
      // display user-joined communities with new content first
      if (a.hasNewContent) return -1;
      if (b.hasNewContent) return 1;

      return b.threadCount - a.threadCount;
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
