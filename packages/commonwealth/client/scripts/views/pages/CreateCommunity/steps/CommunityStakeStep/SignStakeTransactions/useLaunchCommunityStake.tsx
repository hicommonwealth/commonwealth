import { useState } from 'react';

import { STAKE_ID } from '@hicommonwealth/chains';
import { useUpdateCommunityStake } from 'state/api/communityStake';

import { ActionState, defaultActionState } from '../types';
import useNamespaceFactory from '../useNamespaceFactory';

interface UseLaunchCommunityStakeProps {
  namespace: string;
  communityId: string;
  goToSuccessStep: () => void;
  selectedAddress: string;
}

const useLaunchCommunityStake = ({
  namespace,
  communityId,
  goToSuccessStep,
  selectedAddress,
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
        STAKE_ID,
        selectedAddress,
      );

      await updateCommunityStake({
        communityId,
        stakeId: STAKE_ID,
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
