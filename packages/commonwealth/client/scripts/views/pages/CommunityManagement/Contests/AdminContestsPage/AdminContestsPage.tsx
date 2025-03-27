import React, { useState } from 'react';

import commonUrl from 'assets/img/branding/common.svg';
import farcasterUrl from 'assets/img/farcaster.svg';
import useAppStatus from 'hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { useCommonNavigate } from 'navigation/helpers';
import {
  BaseMixpanelPayload,
  MixpanelContestEvents,
} from 'shared/analytics/types';
import app from 'state';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import useGetFeeManagerBalanceQuery from 'state/api/communityStake/getFeeManagerBalance';
import { useFetchTopicsQuery } from 'state/api/topics';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from 'views/pages/404';
import EmptyCard from 'views/pages/CommunityManagement/Contests/EmptyContestsList/EmptyCard';
import CommunityStakeStep from 'views/pages/CreateCommunity/steps/CommunityStakeStep';

import { CWDivider } from '../../../../components/component_kit/cw_divider';
import ContestsList from '../ContestsList';
import EmptyContestsList from '../EmptyContestsList';
import { ContestType, ContestView } from '../types';
import useCommunityContests from '../useCommunityContests';
import FeeManagerBanner from './FeeManagerBanner';

import './AdminContestsPage.scss';

const AdminContestsPage = () => {
  const [contestView, setContestView] = useState<ContestView>(ContestView.List);

  const navigate = useCommonNavigate();
  const user = useUserStore();
  const { isAddedToHomeScreen } = useAppStatus();

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

  const ethChainId = app?.chain?.meta?.ChainNode?.eth_chain_id || 0;
  const chainNodeUrl = app?.chain?.meta?.ChainNode?.url || '';

  const communityId = app.activeChainId() || '';

  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    enabled: !!communityId,
  });

  const { trackAnalytics } = useBrowserAnalyticsTrack<BaseMixpanelPayload>({
    onAction: true,
  });

  const {
    stakeEnabled,
    contestsData,
    isContestAvailable,
    isContestDataLoading,
  } = useCommunityContests({ shouldPolling: true });

  const { data: topicData } = useFetchTopicsQuery({
    communityId,
    apiEnabled: !!communityId,
  });

  const hasAtLeastOneWeightedVotingTopic = topicData?.some(
    (t) => t.weighted_voting,
  );

  const { data: feeManagerBalance, isLoading: isFeeManagerBalanceLoading } =
    useGetFeeManagerBalanceQuery({
      ethChainId: ethChainId!,
      namespace: community?.namespace || '',
      apiEnabled: Boolean(
        !!ethChainId && !!community?.namespace ? true : stakeEnabled,
      ),
    });

  const handleCreateContestClicked = () => {
    trackAnalytics({
      event: MixpanelContestEvents.CREATE_CONTEST_BUTTON_PRESSED,
      isPWA: isAddedToHomeScreen,
    });

    setContestView(ContestView.TypeSelection);
  };

  if (!user.isLoggedIn || !isAdmin) {
    return <PageNotFound />;
  }

  const selectedAddress = user.addresses.find(
    (x) =>
      x.address === user.activeAccount?.address &&
      x.community?.id === community?.id,
  );

  const showBanner =
    hasAtLeastOneWeightedVotingTopic &&
    isContestAvailable &&
    ethChainId &&
    community?.namespace;

  const gotToContestTypeSelection = () => {
    setContestView(ContestView.TypeSelection);
  };

  const goToLaunchFarcasterContest = () => {
    navigate(`/manage/contests/launch?type=${ContestType.Farcaster}`);
  };

  const goToLaunchCommonContest = () => {
    navigate(`/manage/contests/launch?type=${ContestType.Common}`);
  };

  // Check if there are any contests (active or finished)
  const hasNoContests =
    !isContestDataLoading &&
    contestsData.active.length === 0 &&
    contestsData.finished.length === 0;

  return (
    <CWPageLayout>
      <div className="AdminContestsPage">
        <div className="admin-header-row">
          <CWText type="h2">Contests</CWText>

          {contestView === ContestView.List &&
            isContestAvailable &&
            !hasNoContests && (
              <CWButton
                iconLeft="plusPhosphor"
                label="Create contest"
                onClick={handleCreateContestClicked}
              />
            )}
        </div>

        {contestView === ContestView.List ? (
          <>
            {hasNoContests ? (
              <EmptyContestsList onSetContestView={setContestView} />
            ) : (
              <>
                {showBanner && (
                  <FeeManagerBanner
                    feeManagerBalance={feeManagerBalance}
                    isLoading={isFeeManagerBalanceLoading}
                  />
                )}
                <CWText type="h3" className="mb-12">
                  Active Contests
                </CWText>
                {!isContestAvailable && !contestsData.active.length ? (
                  <CWText>No active contests available</CWText>
                ) : (
                  <ContestsList
                    contests={contestsData.active}
                    isAdmin={isAdmin}
                    isLoading={isContestDataLoading}
                    isContestAvailable={isContestAvailable}
                    onSetContestView={setContestView}
                    community={{
                      id: community?.id || '',
                      name: community?.name || '',
                      iconUrl: community?.icon_url || '',
                      ethChainId,
                      chainNodeUrl,
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
                    isAdmin={isAdmin}
                    isLoading={isContestDataLoading}
                    isContestAvailable={isContestAvailable}
                    displayAllRecurringContests
                    onSetContestView={setContestView}
                    community={{
                      id: community?.id || '',
                      name: community?.name || '',
                      iconUrl: community?.icon_url || '',
                      ethChainId,
                      chainNodeUrl,
                    }}
                  />
                )}
              </>
            )}
          </>
        ) : contestView === ContestView.TypeSelection ? (
          <div className="type-selection-list">
            <EmptyCard
              img={commonUrl}
              title="Launch on Common"
              subtitle={
                hasAtLeastOneWeightedVotingTopic
                  ? 'Setting up a contest just takes a few minutes and can be a huge boost to your community.'
                  : `For weighted contests, you need at least one topic with weighted voting enabled. 
                    You can still proceed to set up your contest.`
              }
              button={{
                label: 'Launch Common contest',
                handler: goToLaunchCommonContest,
              }}
            />

            <EmptyCard
              img={farcasterUrl}
              title="Launch on Farcaster"
              subtitle={
                community?.namespace
                  ? 'Share your contest on Farcaster'
                  : 'You need a namespace for your community to run Farcaster contests. Set one up first.'
              }
              button={{
                label: community?.namespace
                  ? 'Launch Farcaster contest'
                  : 'Create a namespace',
                handler: community?.namespace
                  ? goToLaunchFarcasterContest
                  : () => setContestView(ContestView.NamespaceEnablemenement),
              }}
            />
          </div>
        ) : contestView === ContestView.NamespaceEnablemenement ? (
          <CommunityStakeStep
            createdCommunityName={community?.name}
            createdCommunityId={community?.id || ''}
            selectedAddress={selectedAddress!}
            chainId={String(ethChainId)}
            onlyNamespace
            onEnableStakeStepCancel={gotToContestTypeSelection}
            onSignTransactionsStepReserveNamespaceSuccess={
              goToLaunchFarcasterContest
            }
            onSignTransactionsStepCancel={gotToContestTypeSelection}
          />
        ) : null}
      </div>
    </CWPageLayout>
  );
};

export default AdminContestsPage;
