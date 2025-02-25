import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { useMutation } from '@tanstack/react-query';
import NamespaceFactory from 'client/scripts/helpers/ContractHelpers/NamespaceFactory';
import { queryClient } from 'state/api/config';

export interface MintAdminTokenProps {
  namespace: string;
  walletAddress: string;
  adminAddress: string;
  chainRpc: string;
  ethChainId: number;
  chainId: string;
}

export const mintAdminToken = async ({
  namespace,
  walletAddress,
  adminAddress,
  chainRpc,
  ethChainId,
  chainId,
}: MintAdminTokenProps) => {
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

  return await namespaceFactory.mintNamespaceTokens(
    namespace,
    0, // token ID for admin
    1, // desired balance (grant admin privileges)
    adminAddress,
    chainId,
    walletAddress,
  );
};

interface UseMintAdminTokenMutationProps {}

const useMintAdminTokenMutation = ({}: UseMintAdminTokenMutationProps = {}) => {
  return useMutation({
    mutationFn: mintAdminToken,
    onSuccess: async (_, variables: MintAdminTokenProps) => {
      await queryClient.invalidateQueries({
        queryKey: [
          'namespaceTokens',
          variables.namespace,
          variables.adminAddress,
        ],
      });
    },
  });
};

export default useMintAdminTokenMutation;
