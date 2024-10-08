import React, { useState } from 'react';

import commonUrl from 'assets/img/branding/common.svg';
import farcasterUrl from 'assets/img/farcaster.svg';
import useAppStatus from 'hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { useFlag } from 'hooks/useFlag';
import { useCommonNavigate } from 'navigation/helpers';
import {
  BaseMixpanelPayload,
  MixpanelContestEvents,
} from 'shared/analytics/types';
import app from 'state';
import useGetFeeManagerBalanceQuery from 'state/api/communityStake/getFeeManagerBalance';
import { useFetchTopicsQuery } from 'state/api/topics';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
import { useCommunityStake } from 'views/components/CommunityStake';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from 'views/pages/404';
import EmptyCard from 'views/pages/CommunityManagement/Contests/EmptyContestsList/EmptyCard';

import ContestsList from '../ContestsList';
import { ContestType, ContestView } from '../types';
import useCommunityContests from '../useCommunityContests';
import FeeManagerBanner from './FeeManagerBanner';

import './AdminContestsPage.scss';

const AdminContestsPage = () => {
  const farcasterContestEnabled = useFlag('farcasterContest');
  const [contestView, setContestView] = useState<ContestView>(ContestView.List);

  const navigate = useCommonNavigate();
  const user = useUserStore();
  const { isAddedToHomeScreen } = useAppStatus();

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

  const ethChainId = app?.chain?.meta?.ChainNode?.eth_chain_id || 0;
  const { stakeData } = useCommunityStake();
  const namespace = stakeData?.Community?.namespace;
  const communityId = app.activeChainId() || '';

  const { trackAnalytics } = useBrowserAnalyticsTrack<BaseMixpanelPayload>({
    onAction: true,
  });

  const {
    stakeEnabled,
    contestsData,
    isContestAvailable,
    isContestDataLoading,
  } = useCommunityContests();

  const { data: topicData } = useFetchTopicsQuery({
    communityId,
    apiEnabled: !!communityId,
  });

  const hasAtLeastOneWeightedVotingTopic = topicData?.some(
    (t) => t.weightedVoting,
  );

  const { data: feeManagerBalance, isLoading: isFeeManagerBalanceLoading } =
    useGetFeeManagerBalanceQuery({
      ethChainId: ethChainId!,
      namespace,
      apiEnabled:
        !!ethChainId && !!namespace && farcasterContestEnabled
          ? true
          : stakeEnabled,
    });

  const handleCreateContestClicked = () => {
    trackAnalytics({
      event: MixpanelContestEvents.CREATE_CONTEST_BUTTON_PRESSED,
      isPWA: isAddedToHomeScreen,
    });

    return farcasterContestEnabled
      ? setContestView(ContestView.TypeSelection)
      : navigate('/manage/contests/launch');
  };

  if (!user.isLoggedIn || !isAdmin) {
    return <PageNotFound />;
  }

  const showBanner =
    (farcasterContestEnabled
      ? hasAtLeastOneWeightedVotingTopic
      : stakeEnabled) &&
    isContestAvailable &&
    ethChainId &&
    namespace;

  return (
    <CWPageLayout>
      <div className="AdminContestsPage">
        <div className="admin-header-row">
          <CWText type="h2">Contests</CWText>

          {(farcasterContestEnabled
            ? hasAtLeastOneWeightedVotingTopic
            : stakeEnabled) &&
            contestView !== ContestView.TypeSelection && (
              <CWButton
                iconLeft="plusPhosphor"
                label="Create contest"
                onClick={handleCreateContestClicked}
              />
            )}
        </div>

        {contestView === ContestView.List ? (
          <>
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
              hasWeightedTopic={!!hasAtLeastOneWeightedVotingTopic}
              isContestAvailable={isContestAvailable}
              stakeEnabled={stakeEnabled}
              feeManagerBalance={feeManagerBalance}
              onSetContestSelectionView={() =>
                setContestView(ContestView.TypeSelection)
              }
            />
          </>
        ) : (
          <div className="type-selection-list">
            <EmptyCard
              img={commonUrl}
              title="Launch on Common"
              subtitle="lorem ipsum dolor sit amet"
              button={{
                label: 'Launch Common contest',
                handler: () =>
                  navigate(
                    `/manage/contests/launch?type=${ContestType.Common}`,
                  ),
              }}
            />
            <EmptyCard
              img={farcasterUrl}
              title="Launch on Farcaster"
              subtitle="lorem ipsum dolor sit amet"
              button={{
                label: 'Launch Farcaster contest',
                handler: () =>
                  navigate(
                    `/manage/contests/launch?type=${ContestType.Farcaster}`,
                  ),
              }}
            />
          </div>
        )}
      </div>
    </CWPageLayout>
  );
};

export default AdminContestsPage;

// fix breadcrumbs
