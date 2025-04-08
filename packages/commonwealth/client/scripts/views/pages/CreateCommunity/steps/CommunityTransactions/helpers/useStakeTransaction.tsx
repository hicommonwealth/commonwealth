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

/**
 * Hook for handling community stake launch transaction
 */
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
    // Skip if already completed or in progress
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

      // Configure community stakes through the namespace factory
      await namespaceFactory.configureCommunityStakes(
        namespace,
        commonProtocol.STAKE_ID,
        userAddress,
        chainId,
      );

      // Update community stake in the backend
      await updateCommunityStake({
        communityId,
        stakeId: commonProtocol.STAKE_ID,
      });

      // Mark transaction as completed
      setTransactionData({
        state: 'completed',
        errorText: '',
      });

      // Track analytics
      trackAnalytics({
        event: MixpanelCommunityStakeEvent.LAUNCHED_COMMUNITY_STAKE,
        community: chainId,
        userId: user.activeAccount?.profile?.userId,
        userAddress: userAddress,
        isPWA: isAddedToHomeScreen,
      });

      // Trigger success callback
      onSuccess?.();
    } catch (err) {
      console.log(err);

      // Set error message
      const error =
        'There was an issue launching community stakes. Please try again.';

      // Reset to not-started with error
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
