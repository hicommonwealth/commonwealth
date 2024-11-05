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

    return farcasterContestEnabled
      ? setContestView(ContestView.TypeSelection)
      : navigate('/manage/contests/launch');
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

  return (
    <CWPageLayout>
      <div className="AdminContestsPage">
        <div className="admin-header-row">
          <CWText type="h2">Contests</CWText>

          {hasAtLeastOneWeightedVotingTopic &&
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
              onSetContestView={setContestView}
              hasNamespace={!!community?.namespace}
            />
          </>
        ) : contestView === ContestView.TypeSelection ? (
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
                handler: () => {
                  if (community?.namespace) {
                    return navigate(
                      `/manage/contests/launch?type=${ContestType.Farcaster}`,
                    );
                  }

                  setContestView(ContestView.NamespaceEnablemenement);
                },
              }}
            />
          </div>
        ) : contestView === ContestView.NamespaceEnablemenement ? (
          <CommunityStakeStep
            goToSuccessStep={() => console.log('goToSuccessStep')}
            createdCommunityName={community?.name}
            createdCommunityId={community?.id || ''}
            selectedAddress={selectedAddress!}
            chainId={String(ethChainId)}
            onlyNamespace
          />
        ) : null}
      </div>
    </CWPageLayout>
  );
};

export default AdminContestsPage;
