import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { useState } from 'react';
import {
  BaseMixpanelPayload,
  MixpanelCommunityStakeEvent,
} from 'shared/analytics/types';
import { useUpdateCommunityStake } from 'state/api/communityStake';
import useUserStore from 'state/ui/user';
import useAppStatus from '../../../../../../hooks/useAppStatus';
import { ActionState, defaultActionState } from '../types';
import useNamespaceFactory from '../useNamespaceFactory';

interface UseLaunchCommunityStakeProps {
  namespace: string;
  communityId: string;
  goToSuccessStep: () => void;
  selectedAddress: string;
  chainId: string;
}

const useLaunchCommunityStake = ({
  namespace,
  communityId,
  goToSuccessStep,
  selectedAddress,
  chainId,
}: UseLaunchCommunityStakeProps) => {
  const [launchStakeData, setLaunchStakeData] =
    useState<ActionState>(defaultActionState);

  const { namespaceFactory } = useNamespaceFactory(parseInt(chainId));
  const { mutateAsync: updateCommunityStake } = useUpdateCommunityStake();

  const { isAddedToHomeScreen } = useAppStatus();

  const user = useUserStore();

  const { trackAnalytics } = useBrowserAnalyticsTrack<BaseMixpanelPayload>({
    onAction: true,
  });

  const handleLaunchCommunityStake = async () => {
    try {
      setLaunchStakeData({
        state: 'loading',
        errorText: '',
      });

      await namespaceFactory.configureCommunityStakes(
        namespace,
        commonProtocol.STAKE_ID,
        selectedAddress,
        chainId,
      );

      await updateCommunityStake({
        communityId,
        stakeId: commonProtocol.STAKE_ID,
      });

      setLaunchStakeData({
        state: 'completed',
        errorText: '',
      });

      trackAnalytics({
        event: MixpanelCommunityStakeEvent.LAUNCHED_COMMUNITY_STAKE,
        community: chainId,
        userId: user.activeAccount?.profile?.userId,
        userAddress: selectedAddress,
        isPWA: isAddedToHomeScreen,
      });

      goToSuccessStep();
    } catch (err) {
      console.log(err);

      const error =
        'There was an issue launching community stakes. Please try again.';

      setLaunchStakeData({
        state: 'not-started',
        errorText: error,
      });
    }
  };

  return { handleLaunchCommunityStake, launchStakeData };
};

export default useLaunchCommunityStake;
