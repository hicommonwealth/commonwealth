import React, { useState } from 'react';

import commonUrl from 'assets/img/branding/common.svg';
import farcasterUrl from 'assets/img/farcaster.svg';
import shape2Url from 'assets/img/shapes/shape2.svg';
import useAppStatus from 'hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { useFlag } from 'hooks/useFlag';
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

  return (
    <CWPageLayout>
      <div className="AdminContestsPage">
        <div className="admin-header-row">
          <CWText type="h2">Contests</CWText>

          {contestView === ContestView.List && isContestAvailable && (
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
              />
            )}

            <CWDivider className="ended" />
            <CWText type="h3" className="mb-12">
              Previous Contests
            </CWText>
            {isContestAvailable && !contestsData.active.length ? (
              <CWText>No previous contests available</CWText>
            ) : (
              <ContestsList
                contests={contestsData.finished}
                isAdmin={isAdmin}
                isLoading={isContestDataLoading}
                isContestAvailable={isContestAvailable}
                displayAllRecurringContests
                onSetContestView={setContestView}
              />
            )}
          </>
        ) : contestView === ContestView.TypeSelection ? (
          <div className="type-selection-list">
            {hasAtLeastOneWeightedVotingTopic ? (
              <EmptyCard
                img={commonUrl}
                title="Launch on Common"
                subtitle="Setting up a contest just takes a few minutes and can be a huge boost to your community."
                button={{
                  label: 'Launch Common contest',
                  handler: () =>
                    navigate(
                      `/manage/contests/launch?type=${ContestType.Common}`,
                    ),
                }}
              />
            ) : (
              <EmptyCard
                img={shape2Url}
                title="You must have at least one topic with weighted voting enabled to run contest"
                subtitle="Setting up a contest just takes a few minutes and can be a huge boost to your community."
                button={{
                  label: 'Create a topic',
                  handler: () => navigate('/manage/topics'),
                }}
              />
            )}

            {!farcasterContestEnabled ? null : community?.namespace ? (
              <EmptyCard
                img={farcasterUrl}
                title="Launch on Farcaster"
                subtitle="Share your contest on Farcastr platform"
                button={{
                  label: 'Launch Farcaster contest',
                  handler: () => {
                    goToLaunchFarcasterContest();
                  },
                }}
              />
            ) : (
              <EmptyCard
                img={farcasterUrl}
                title="You must have namespace reserved for your community to run farcaster contest"
                subtitle="Share your contest on Farcastr platform"
                button={{
                  label: 'Create a namespace',
                  handler: () => {
                    setContestView(ContestView.NamespaceEnablemenement);
                  },
                }}
              />
            )}
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
