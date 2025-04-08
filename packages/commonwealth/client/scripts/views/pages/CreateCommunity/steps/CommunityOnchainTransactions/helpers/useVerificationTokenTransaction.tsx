import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { useMutation } from '@tanstack/react-query';
import NamespaceFactory from 'client/scripts/helpers/ContractHelpers/NamespaceFactory';
import { useState } from 'react';
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

const mintVerificationToken = async ({
  namespace,
  userAddress,
  ethChainId,
  chainRpc,
}: {
  namespace: string;
  userAddress: string;
  ethChainId: number;
  chainRpc: string;
}) => {
  if (
    !commonProtocol.factoryContracts ||
    !commonProtocol.factoryContracts[ethChainId] ||
    !commonProtocol.factoryContracts[ethChainId].factory
  ) {
    throw new Error(
      `Factory configuration is missing for chain ID ${ethChainId}. Please check your commonProtocol configuration.`,
    );
  }

  const factoryAddress = commonProtocol.factoryContracts[ethChainId].factory;
  const namespaceFactory = new NamespaceFactory(factoryAddress, chainRpc);

  // Mint the verification token (ID 0) to the user's address
  return await namespaceFactory.mintNamespaceTokens(
    namespace,
    0, // ID 0 is the verification token
    1, // Mint 1 token
    userAddress, // Mint to the user's address
    '', // Empty chainId string since we're using ethereum
    userAddress, // Transaction sender
  );
};

const useVerificationTokenTransaction = ({
  namespace,
  userAddress,
  chainId,
  onSuccess,
}: UseVerificationTokenTransactionProps): TransactionHookResult => {
  const [transactionData, setTransactionData] = useState<TransactionData>(
    defaultTransactionState,
  );

  const { mutateAsync: mintToken } = useMutation({
    mutationFn: mintVerificationToken,
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

      await mintToken({
        namespace,
        userAddress,
        ethChainId: parseInt(chainId),
        chainRpc: '', // This will be fetched from the chain node
      });

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
