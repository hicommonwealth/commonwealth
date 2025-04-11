import { factoryContracts } from '@hicommonwealth/evm-protocols';
import CommunityNominations from 'helpers/ContractHelpers/CommunityNominations';
import { useState } from 'react';
import { useFetchNodesQuery } from 'state/api/nodes';
import {
  TransactionData,
  TransactionHookResult,
  defaultTransactionState,
} from '../types';

interface UseVerificationTokenTransactionProps {
  namespace: string;
  userAddress: string;
  chainId: string;
  onSuccess?: () => void;
}

const useVerificationTokenTransaction = ({
  namespace,
  userAddress,
  chainId,
  onSuccess,
}: UseVerificationTokenTransactionProps): TransactionHookResult => {
  const [transactionData, setTransactionData] = useState<TransactionData>(
    defaultTransactionState,
  );

  const { data: nodes } = useFetchNodesQuery();

  const chainRpc = nodes?.find(
    (node) => node.ethChainId === parseInt(chainId),
  )?.url;

  const contractAddress = factoryContracts?.[chainId]?.communityNomination;

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

      if (!chainRpc) {
        throw new Error('Chain RPC not found');
      }

      if (!contractAddress) {
        throw new Error('Contract address not found');
      }

      const communityNominations = new CommunityNominations(
        contractAddress,
        chainRpc,
      );

      await communityNominations.mintVerificationToken(
        namespace,
        userAddress,
        chainId,
      );

      setTransactionData({
        state: 'completed',
        errorText: '',
      });

      onSuccess?.();
    } catch (err) {
      console.error(err);

      const error =
        'There was an issue minting the verification token. Please try again.';

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

export default useVerificationTokenTransaction;
