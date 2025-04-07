import { ChainBase } from '@hicommonwealth/shared';
import { setActiveAccount } from 'client/scripts/controllers/app/login';
import Account from 'client/scripts/models/Account';
import { buildUpdateCommunityInput } from 'client/scripts/state/api/communities/updateCommunity';
import useAppStatus from 'hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { useFlag } from 'hooks/useFlag';
import { useState } from 'react';
import {
  BaseMixpanelPayload,
  MixpanelCommunityStakeEvent,
} from 'shared/analytics/types';
import { useUpdateCommunityMutation } from 'state/api/communities';
import useUserStore from 'state/ui/user';
import useNamespaceFactory from '../CommunityStakeStep/useNamespaceFactory';
import {
  TransactionData,
  TransactionHookResult,
  defaultTransactionState,
} from './types';

interface UseNamespaceTransactionProps {
  communityId: string;
  namespace: string;
  symbol: string;
  userAddress: string;
  chainId: string;
  onSuccess?: () => void;
  hasNamespaceReserved?: boolean;
  referrerAddress?: string | null;
}

/**
 * Hook for handling namespace reservation transaction
 */
const useNamespaceTransaction = ({
  communityId,
  namespace,
  symbol,
  userAddress,
  chainId,
  onSuccess,
  hasNamespaceReserved,
  referrerAddress,
}: UseNamespaceTransactionProps): TransactionHookResult => {
  const [transactionData, setTransactionData] = useState<TransactionData>(
    hasNamespaceReserved
      ? { state: 'completed', errorText: '' }
      : defaultTransactionState,
  );

  const onchainReferralsEnabled = useFlag('onchainReferrals');
  const { namespaceFactory } = useNamespaceFactory(parseInt(chainId));
  const { mutateAsync: updateCommunity } = useUpdateCommunityMutation({
    communityId,
    reInitAppOnSuccess: true,
  });

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

      // Set active account for community update
      await setActiveAccount(
        new Account({
          community: {
            id: communityId,
            base: ChainBase.Ethereum, // namespaces only support EVM
          },
          address: userAddress,
        }),
      );

      // Deploy namespace with or without referrer
      const txReceipt =
        referrerAddress && onchainReferralsEnabled
          ? await namespaceFactory.deployNamespaceWithReferrer(
              namespace,
              userAddress,
              userAddress,
              referrerAddress,
              chainId,
            )
          : await namespaceFactory.deployNamespace(
              namespace,
              userAddress,
              userAddress,
              chainId,
            );

      // Update community with namespace info
      await updateCommunity(
        buildUpdateCommunityInput({
          communityId,
          namespace,
          symbol,
          transactionHash: txReceipt.transactionHash,
        }),
      );

      // Mark transaction as completed
      setTransactionData({
        state: 'completed',
        errorText: '',
      });

      // Trigger success callback
      onSuccess?.();

      // Track analytics
      trackAnalytics({
        event: MixpanelCommunityStakeEvent.RESERVED_COMMUNITY_NAMESPACE,
        community: chainId,
        userId: user.activeAccount?.profile?.userId,
        userAddress: userAddress,
        isPWA: isAddedToHomeScreen,
      });
    } catch (err) {
      console.log(err);

      // Handle specific error case
      const error = err?.message?.includes('Namespace already reserved')
        ? 'Namespace already reserved'
        : 'There was an issue creating the namespace. Please try again.';

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

export default useNamespaceTransaction;
