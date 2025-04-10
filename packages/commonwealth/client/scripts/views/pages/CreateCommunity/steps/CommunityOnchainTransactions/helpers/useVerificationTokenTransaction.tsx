import { useState } from 'react';
import {
  TransactionData,
  TransactionHookResult,
  defaultTransactionState,
} from '../types';
import useNamespaceFactory from './useNamespaceFactory';

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

      await namespaceFactory.mintNamespaceTokens(
        namespace,
        3,
        5,
        userAddress,
        chainId,
        userAddress,
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
