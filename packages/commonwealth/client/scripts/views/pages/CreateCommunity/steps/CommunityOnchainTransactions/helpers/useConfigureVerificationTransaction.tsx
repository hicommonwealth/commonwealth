import { useState } from 'react';
import {
  TransactionData,
  TransactionHookResult,
  defaultTransactionState,
} from '../types';
import useNamespaceFactory from './useNamespaceFactory';

interface UseConfigureVerificationTransactionProps {
  namespace: string;
  userAddress: string;
  chainId: string;
  onSuccess?: () => void;
}

const useConfigureVerificationTransaction = ({
  namespace,
  userAddress,
  chainId,
  onSuccess,
}: UseConfigureVerificationTransactionProps): TransactionHookResult => {
  const [transactionData, setTransactionData] = useState<TransactionData>(
    defaultTransactionState,
  );

  const { namespaceFactory } = useNamespaceFactory(parseInt(chainId));

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

      await namespaceFactory.configureVerification(namespace, userAddress);

      setTransactionData({
        state: 'completed',
        errorText: '',
      });

      onSuccess?.();
    } catch (err) {
      console.error(err);

      const error =
        'There was an issue configuring verification. Please try again.';

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

export default useConfigureVerificationTransaction;
