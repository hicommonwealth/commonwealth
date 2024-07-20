import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { useState } from 'react';
import {
  BaseMixpanelPayload,
  MixpanelCommunityStakeEvent,
} from 'shared/analytics/types';
import { useUpdateCommunityMutation } from 'state/api/communities';
import useUserStore from 'state/ui/user';
import useAppStatus from '../../../../../../hooks/useAppStatus';
import { ActionState, defaultActionState } from '../types';
import useNamespaceFactory from '../useNamespaceFactory';

interface UseReserveCommunityNamespaceProps {
  communityId: string;
  namespace: string;
  symbol: string;
  userAddress: string;
  chainId: string;
}

const useReserveCommunityNamespace = ({
  communityId,
  namespace,
  symbol,
  userAddress,
  chainId,
}: UseReserveCommunityNamespaceProps) => {
  const [reserveNamespaceData, setReserveNamespaceData] =
    useState<ActionState>(defaultActionState);

  const { namespaceFactory } = useNamespaceFactory(parseInt(chainId));
  const { mutateAsync: updateCommunity } = useUpdateCommunityMutation();

  const { isAddedToHomeScreen } = useAppStatus();
  const user = useUserStore();

  const { trackAnalytics } = useBrowserAnalyticsTrack<BaseMixpanelPayload>({
    onAction: true,
  });

  const handleReserveCommunityNamespace = async () => {
    try {
      setReserveNamespaceData({
        state: 'loading',
        errorText: '',
      });

      const txReceipt = await namespaceFactory.deployNamespace(
        namespace,
        userAddress,
        userAddress,
        chainId,
      );

      await updateCommunity({
        communityId,
        namespace,
        symbol,
        transactionHash: txReceipt.transactionHash,
      });

      setReserveNamespaceData({
        state: 'completed',
        errorText: '',
      });

      trackAnalytics({
        event: MixpanelCommunityStakeEvent.RESERVED_COMMUNITY_NAMESPACE,
        community: chainId,
        userId: user.activeAccount?.profile?.userId,
        userAddress: userAddress,
        isPWA: isAddedToHomeScreen,
      });
    } catch (err) {
      console.log(err);

      const error = err?.message?.includes('Namespace already reserved')
        ? 'Namespace already reserved'
        : 'There was an issue creating the namespace. Please try again.';

      setReserveNamespaceData({
        state: 'not-started',
        errorText: error,
      });
    }
  };

  return { handleReserveCommunityNamespace, reserveNamespaceData };
};

export default useReserveCommunityNamespace;
