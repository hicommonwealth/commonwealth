import { pluralize } from 'helpers';
import ChainInfo from '../../../models/ChainInfo';
import { useCommonNavigate } from 'navigation/helpers';
import 'pages/user_dashboard/dashboard_communities_preview.scss';
import React from 'react';

import app from 'state';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWCard } from '../../components/component_kit/cw_card';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { CWText } from '../../components/component_kit/cw_text';

type CommunityPreviewCardProps = {
  chain: ChainInfo;
};

const CommunityPreviewCard = (props: CommunityPreviewCardProps) => {
  const { chain } = props;

  const navigate = useCommonNavigate();

  const { unseenPosts } = app.user;
  const visitedChain = !!unseenPosts[chain.id];
  const updatedThreads = unseenPosts[chain.id]?.activePosts || 0;
  const monthlyThreadCount = app.recentActivity.getCommunityThreadCount(
    chain.id
  );
  const isMember = app.roles.isMember({
    account: app.user.activeAccount,
    chain: chain.id,
  });

  return (
    <CWCard
      className="CommunityPreviewCard"
      elevation="elevation-1"
      interactive
      onClick={(e) => {
        e.preventDefault();
        navigate(`/${chain.id}`);
      }}
    >
      <div className="card-top">
        <CWCommunityAvatar community={chain} />
        <CWText type="h4" fontWeight="medium">
          {chain.name}
        </CWText>
      </div>
      <CWText className="card-subtext" type="b2">
        {chain.description}
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

export const DashboardCommunitiesPreview = () => {
  const navigate = useCommonNavigate();

  const sortedChains = app.config.chains
    .getAll()
    .sort((a, b) => {
      const threadCountA = app.recentActivity.getCommunityThreadCount(a.id);
      const threadCountB = app.recentActivity.getCommunityThreadCount(b.id);
      return threadCountB - threadCountA;
    })
    .map((chain, i) => {
      return <CommunityPreviewCard key={i} chain={chain} />;
    });

  return (
    <div className="DashboardCommunitiesPreview">
      <CWText type="h4">Suggested Communities</CWText>
      <div className="community-preview-cards-collection">
        {sortedChains.length > 3 ? sortedChains.slice(0, 3) : sortedChains}
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
