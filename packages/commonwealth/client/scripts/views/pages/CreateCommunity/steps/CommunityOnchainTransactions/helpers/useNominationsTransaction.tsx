import { useState } from 'react';
import useConfigureNominationsMutation from 'state/api/contests/configureNominations';
import {
  TransactionData,
  TransactionHookResult,
  defaultTransactionState,
} from '../types';

interface UseNominationsTransactionProps {
  namespace: string;
  userAddress: string;
  chainId: string;
  onSuccess?: () => void;
}

const useNominationsTransaction = ({
  namespace,
  userAddress,
  chainId,
  onSuccess,
}: UseNominationsTransactionProps): TransactionHookResult => {
  const [transactionData, setTransactionData] = useState<TransactionData>(
    defaultTransactionState,
  );

  const { mutateAsync: configureNominations } =
    useConfigureNominationsMutation();

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

      await configureNominations({
        namespaceName: namespace,
        creatorOnly: true,
        walletAddress: userAddress,
        maxNominations: 5,
        ethChainId: parseInt(chainId),
        chainRpc: '',
      });

      setTransactionData({
        state: 'completed',
        errorText: '',
      });

      onSuccess?.();
    } catch (err) {
      console.log(err);

      const error =
        'There was an issue configuring nominations. Please try again.';

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

export default useNominationsTransaction;
