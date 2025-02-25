import React from 'react';
import { Navigate } from 'react-router-dom';

import app from 'state';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { CWText } from 'views/components/component_kit/cw_text';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import ContestsList from 'views/pages/CommunityManagement/Contests/ContestsList';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';

import { BLOG_SUBDOMAIN } from '@hicommonwealth/shared';
import { CWDivider } from '../../components/component_kit/cw_divider';

import './Contests.scss';

const Contests = () => {
  const { contestsData, isContestAvailable, isContestDataLoading } =
    useCommunityContests();

  const { data: community } = useGetCommunityByIdQuery({
    id: app.activeChainId() || '',
    enabled: !!app.activeChainId(),
  });

  if (!isContestDataLoading && !isContestAvailable) {
    return <Navigate replace to={`/${app.activeChainId()}`} />;
  }

  return (
    <CWPageLayout>
      <div className="Contests">
        <CWText type="h2">Contests</CWText>
        <CWText className="description">
          Check out the contests in this community. Winners are determined by
          having the most upvoted content in the contest topics.{' '}
          <a href={BLOG_SUBDOMAIN}>Learn more</a>
        </CWText>

        <CWDivider className="active" />
        <CWText type="h3" className="mb-12">
          Active Contests
        </CWText>
        {isContestAvailable && contestsData.active.length === 0 ? (
          <CWText>No active contests available</CWText>
        ) : (
          <ContestsList
            contests={contestsData.active}
            isAdmin={false}
            isLoading={isContestDataLoading}
            isContestAvailable={isContestAvailable}
            community={{
              id: community?.id || '',
              name: community?.name || '',
              iconUrl: community?.icon_url || '',
            }}
          />
        )}

        <CWDivider className="ended" />
        <CWText type="h3" className="mb-12">
          Previous Contests
        </CWText>
        {isContestAvailable && contestsData.finished.length === 0 ? (
          <CWText>No previous contests available</CWText>
        ) : (
          <ContestsList
            contests={contestsData.finished}
            isAdmin={false}
            isLoading={isContestDataLoading}
            isContestAvailable={isContestAvailable}
            displayAllRecurringContests
            community={{
              id: community?.id || '',
              name: community?.name || '',
              iconUrl: community?.icon_url || '',
            }}
          />
        )}
      </div>
    </CWPageLayout>
  );
};

export default Contests;
