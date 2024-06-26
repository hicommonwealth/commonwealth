import React from 'react';

import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import Permissions from 'utils/Permissions';
import { useCommunityStake } from 'views/components/CommunityStake';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from 'views/pages/404';

import ContestsList from '../ContestsList';
import useCommunityContests from '../useCommunityContests';
import FeeManagerBanner from './FeeManagerBanner';

import './AdminContestsPage.scss';

const AdminContestsPage = () => {
  const navigate = useCommonNavigate();

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

  const ethChainId = app?.chain?.meta?.ChainNode?.ethChainId;
  const { stakeData } = useCommunityStake();
  const namespace = stakeData?.Community?.namespace;

  const {
    stakeEnabled,
    contestsData,
    isContestAvailable,
    isContestDataLoading,
  } = useCommunityContests();

  if (!app.isLoggedIn() || !isAdmin) {
    return <PageNotFound />;
  }

  const showBanner =
    stakeEnabled && isContestAvailable && ethChainId && namespace;

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

        {showBanner && (
          <FeeManagerBanner ethChainId={ethChainId} namespace={namespace} />
        )}

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
