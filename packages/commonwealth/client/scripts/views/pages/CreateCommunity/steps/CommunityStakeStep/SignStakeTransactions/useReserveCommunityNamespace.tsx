import { useState } from 'react';
import { useUpdateCommunityMutation } from 'state/api/communities';

import { ActionState, defaultActionState } from '../types';
import useNamespaceFactory from '../useNamespaceFactory';

interface UseReserveCommunityNamespaceProps {
  communityId: string;
  namespace: string;
  symbol: string;
  userAddress: string;
}

const useReserveCommunityNamespace = ({
  communityId,
  namespace,
  symbol,
  userAddress,
}: UseReserveCommunityNamespaceProps) => {
  const [reserveNamespaceData, setReserveNamespaceData] =
    useState<ActionState>(defaultActionState);

  const { namespaceFactory } = useNamespaceFactory();
  const { mutateAsync: updateCommunity } = useUpdateCommunityMutation();

  const handleReserveCommunityNamespace = async () => {
    try {
      setReserveNamespaceData({
        state: 'loading',
        errorText: '',
      });

      const txReceipt = await namespaceFactory.deployNamespace(
        namespace,
        userAddress,
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
