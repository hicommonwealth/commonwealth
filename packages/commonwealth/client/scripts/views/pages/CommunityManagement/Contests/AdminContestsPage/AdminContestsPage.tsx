import React from 'react';

import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import useGetFeeManagerBalanceQuery from 'state/api/communityStake/getFeeManagerBalance';
import Permissions from 'utils/Permissions';
import { useCommunityStake } from 'views/components/CommunityStake';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from 'views/pages/404';

import { useBrowserAnalyticsTrack } from 'client/scripts/hooks/useBrowserAnalyticsTrack';
import useAppStatus from 'hooks/useAppStatus';
import {
  BaseMixpanelPayload,
  MixpanelContestEvents,
} from 'shared/analytics/types';
import ContestsList from '../ContestsList';
import useCommunityContests from '../useCommunityContests';
import './AdminContestsPage.scss';
import FeeManagerBanner from './FeeManagerBanner';

const AdminContestsPage = () => {
  const navigate = useCommonNavigate();

  const { isAddedToHomeScreen } = useAppStatus();

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

  const ethChainId = app?.chain?.meta?.ChainNode?.ethChainId;
  const { stakeData } = useCommunityStake();
  const namespace = stakeData?.Community?.namespace;

  const { trackAnalytics } = useBrowserAnalyticsTrack<BaseMixpanelPayload>({
    onAction: true,
  });

  const {
    stakeEnabled,
    contestsData,
    isContestAvailable,
    isContestDataLoading,
  } = useCommunityContests();

  const { data: feeManagerBalance, isLoading: isFeeManagerBalanceLoading } =
    useGetFeeManagerBalanceQuery({
      ethChainId: ethChainId!,
      namespace,
      apiEnabled: !!ethChainId && !!namespace && stakeEnabled,
    });

  const handleCreateContestClicked = () => {
    trackAnalytics({
      event: MixpanelContestEvents.CREATE_CONTEST_BUTTON_PRESSED,
      isPWA: isAddedToHomeScreen,
    });
    navigate('/manage/contests/launch');
  };

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
              onClick={handleCreateContestClicked}
            />
          )}
        </div>

        {showBanner && (
          <FeeManagerBanner
            feeManagerBalance={feeManagerBalance}
            isLoading={isFeeManagerBalanceLoading}
          />
        )}

        <ContestsList
          contests={contestsData}
          isLoading={isContestDataLoading}
          isAdmin={isAdmin}
          isContestAvailable={isContestAvailable}
          stakeEnabled={stakeEnabled}
          feeManagerBalance={feeManagerBalance}
        />
      </div>
    </CWPageLayout>
  );
};

export default AdminContestsPage;
