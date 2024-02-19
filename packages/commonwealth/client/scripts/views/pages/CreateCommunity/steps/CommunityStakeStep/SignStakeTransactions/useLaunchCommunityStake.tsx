import { commonProtocol } from '@hicommonwealth/core';
import { useState } from 'react';
import { useUpdateCommunityStake } from 'state/api/communityStake';
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

  const { namespaceFactory } = useNamespaceFactory();
  const { mutateAsync: updateCommunityStake } = useUpdateCommunityStake();

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
