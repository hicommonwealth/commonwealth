import React from 'react';

import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import Permissions from 'utils/Permissions';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from 'views/pages/404';

import ContestsList from '../ContestsList';
import useCommunityContests from '../useCommunityContests';

import './AdminContestsPage.scss';

const AdminContestsPage = () => {
  const navigate = useCommonNavigate();

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

  const {
    stakeEnabled,
    contestsData,
    isContestAvailable,
    isContestDataLoading,
  } = useCommunityContests();

  if (!app.isLoggedIn() || !isAdmin) {
    return <PageNotFound />;
  }

  return (
    <CWPageLayout>
      <div className="AdminContestsPage">
        <div className="admin-header-row">
          <CWText type="h2">Contests</CWText>

          {stakeEnabled && (
            <CWButton
              iconLeft="plusPhosphor"
              label="Create contest"
              onClick={() => navigate('/manage/contests/launch')}
            />
          )}
        </div>

        <ContestsList
          contests={contestsData}
          isLoading={isContestDataLoading}
          isAdmin={isAdmin}
          isContestAvailable={isContestAvailable}
          stakeEnabled={stakeEnabled}
        />
      </div>
    </CWPageLayout>
  );
};

export default AdminContestsPage;
