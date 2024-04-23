import React from 'react';
import { Navigate } from 'react-router-dom';

import app from 'state';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';

import './Contests.scss';

const Contests = () => {
  const { stakeEnabled, isContestAvailable } = useCommunityContests();

  if (!stakeEnabled || !isContestAvailable) {
    return <Navigate replace to={`/${app.activeChainId()}`} />;
  }

  return (
    <CWPageLayout>
      <div className="Contests">Contests</div>
    </CWPageLayout>
  );
};

export default Contests;
