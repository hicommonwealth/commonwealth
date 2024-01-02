import { pluralize } from 'helpers';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import app from 'state';
import CommunityInfo from '../../../models/ChainInfo';
import { CWCard } from '../../components/component_kit/cw_card';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { CWText } from '../../components/component_kit/cw_text';

type CommunityPreviewCardProps = {
  community: CommunityInfo;
};

const CommunityPreviewCard = ({ community }: CommunityPreviewCardProps) => {
  const navigate = useCommonNavigate();

  const { unseenPosts } = app.user;
  const visitedChain = !!unseenPosts[community.id];
  const updatedThreads = unseenPosts[community.id]?.activePosts || 0;
  const monthlyThreadCount = app.recentActivity.getCommunityThreadCount(
    community.id,
  );
  const isMember = app.roles.isMember({
    account: app.user.activeAccount,
    community: community.id,
  });

  return (
    <CWCard
      className="CommunityPreviewCard"
      elevation="elevation-1"
      interactive
      onClick={(e) => {
        e.preventDefault();
        navigate(`/${community.id}`);
      }}
    >
      <div className="card-top">
        <CWCommunityAvatar community={community} />
        <CWText type="h4" fontWeight="medium">
          {community.name}
        </CWText>
      </div>
      <CWText className="card-subtext" type="b2">
        {community.description}
      </CWText>
      {/* if no recently active threads, hide this module altogether */}
      {!!monthlyThreadCount && (
        <>
          <CWText className="card-subtext" type="b2" fontWeight="medium">
            {`${pluralize(monthlyThreadCount, 'new thread')} this month`}
          </CWText>
          {isMember && (
            <>
              {app.isLoggedIn() && !visitedChain && (
                <CWText className="new-activity-tag">New</CWText>
              )}
              {updatedThreads > 0 && (
                <CWText className="new-activity-tag">
                  {updatedThreads} new
                </CWText>
              )}
            </>
          )}
        </>
      )}
    </CWCard>
  );
};

export default CommunityPreviewCard;
