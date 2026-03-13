import useCommunityContests from 'features/contests/hooks/useCommunityContests';
import { useCommonNavigate } from 'navigation/helpers';
import { useState } from 'react';
import {
  BaseMixpanelPayload,
  MixpanelContestEvents,
} from 'shared/analytics/types';
import useAppStatus from 'shared/hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from 'shared/hooks/useBrowserAnalyticsTrack';
import { useFlag } from 'shared/hooks/useFlag';
import Permissions from 'shared/utils/Permissions';
import app from 'state';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import useGetFeeManagerBalanceQuery from 'state/api/communityStake/getFeeManagerBalance';
import { useFetchTopicsQuery } from 'state/api/topics';
import useUserStore from 'state/ui/user';
import { ContestType, ContestView } from '../types';
import {
  hasNoContests,
  shouldShowFeeManagerBanner,
} from './adminContestsPage.contracts';

const useAdminContestsPageData = () => {
  const [contestView, setContestView] = useState<ContestView>(ContestView.List);

  const navigate = useCommonNavigate();
  const user = useUserStore();
  const { isAddedToHomeScreen } = useAppStatus();
  const judgeContestEnabled = useFlag('judgeContest');

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();
  const isAuthorized = user.isLoggedIn && isAdmin;

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

  const hasAtLeastOneWeightedVotingTopic = Boolean(
    topicData?.some((topic) => topic.weighted_voting),
  );

  const { data: feeManagerBalance, isLoading: isFeeManagerBalanceLoading } =
    useGetFeeManagerBalanceQuery({
      ethChainId,
      namespace: community?.namespace || '',
      apiEnabled: Boolean(
        !!ethChainId && !!community?.namespace ? true : stakeEnabled,
      ),
    });

  const selectedAddress = user.addresses.find(
    (address) =>
      address.address === user.activeAccount?.address &&
      address.community?.id === community?.id,
  );

  const communityInfo = {
    id: community?.id || '',
    name: community?.name || '',
    iconUrl: community?.icon_url || '',
    ethChainId,
    chainNodeUrl,
  };

  const showBanner = shouldShowFeeManagerBanner({
    hasAtLeastOneWeightedVotingTopic,
    isContestAvailable,
    ethChainId,
    namespace: community?.namespace,
  });

  const contestListIsEmpty = hasNoContests({
    isContestDataLoading,
    activeContestsCount: contestsData.active.length,
    finishedContestsCount: contestsData.finished.length,
  });

  const handleCreateContestClicked = () => {
    trackAnalytics({
      event: MixpanelContestEvents.CREATE_CONTEST_BUTTON_PRESSED,
      isPWA: isAddedToHomeScreen,
    });
    setContestView(ContestView.TypeSelection);
  };

  const goToContestTypeSelection = () => {
    setContestView(ContestView.TypeSelection);
  };

  const goToLaunchFarcasterContest = () => {
    navigate(`/manage/contests/launch?type=${ContestType.Farcaster}`);
  };

  const goToLaunchCommonContest = () => {
    navigate(`/manage/contests/launch?type=${ContestType.Common}`);
  };

  const goToCreateTopicPage = () => {
    navigate('/manage/topics');
  };

  return {
    community,
    communityInfo,
    contestListIsEmpty,
    contestView,
    contestsData,
    ethChainId,
    feeManagerBalance,
    goToContestTypeSelection,
    goToCreateTopicPage,
    goToLaunchCommonContest,
    goToLaunchFarcasterContest,
    handleCreateContestClicked,
    hasAtLeastOneWeightedVotingTopic,
    isAuthorized,
    isContestAvailable,
    isContestDataLoading,
    isFeeManagerBalanceLoading,
    judgeContestEnabled,
    selectedAddress,
    setContestView,
    showBanner,
  };
};

export type AdminContestsPageData = ReturnType<typeof useAdminContestsPageData>;

export default useAdminContestsPageData;
