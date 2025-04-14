import { commonProtocol } from '@hicommonwealth/evm-protocols';
import useAppStatus from 'hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { useState } from 'react';
import {
  BaseMixpanelPayload,
  MixpanelCommunityStakeEvent,
} from 'shared/analytics/types';
import { useUpdateCommunityStake } from 'state/api/communityStake';
import useUserStore from 'state/ui/user';
import {
  TransactionData,
  TransactionHookResult,
  defaultTransactionState,
} from '../types';
import useNamespaceFactory from './useNamespaceFactory';

interface UseStakeTransactionProps {
  namespace: string;
  communityId: string;
  userAddress: string;
  chainId: string;
  onSuccess?: () => void;
}

const useStakeTransaction = ({
  namespace,
  communityId,
  userAddress,
  chainId,
  onSuccess,
}: UseStakeTransactionProps): TransactionHookResult => {
  const [transactionData, setTransactionData] = useState<TransactionData>(
    defaultTransactionState,
  );

  const { namespaceFactory } = useNamespaceFactory(parseInt(chainId));
  const { mutateAsync: updateCommunityStake } = useUpdateCommunityStake();

  const { isAddedToHomeScreen } = useAppStatus();
  const user = useUserStore();

  const { trackAnalytics } = useBrowserAnalyticsTrack<BaseMixpanelPayload>({
    onAction: true,
  });

  const action = async () => {
    if (
      transactionData.state === 'loading' ||
      transactionData.state === 'completed'
    ) {
      return;
    }

    try {
      setTransactionData({
        state: 'loading',
        errorText: '',
      });

      await namespaceFactory.configureCommunityStakes(
        namespace,
        commonProtocol.STAKE_ID,
        userAddress,
        chainId,
      );

      await updateCommunityStake({
        communityId,
        stakeId: commonProtocol.STAKE_ID,
      });

      setTransactionData({
        state: 'completed',
        errorText: '',
      });

      trackAnalytics({
        event: MixpanelCommunityStakeEvent.LAUNCHED_COMMUNITY_STAKE,
        community: chainId,
        userId: user.activeAccount?.profile?.userId,
        userAddress: userAddress,
        isPWA: isAddedToHomeScreen,
      });

      onSuccess?.();
    } catch (err) {
      console.log(err);

      const error =
        'There was an issue launching community stakes. Please try again.';

      setTransactionData({
        state: 'not-started',
        errorText: error,
      });
    }
  };

  return {
    state: transactionData.state,
    errorText: transactionData.errorText,
    action,
  };
};

export default useStakeTransaction;
