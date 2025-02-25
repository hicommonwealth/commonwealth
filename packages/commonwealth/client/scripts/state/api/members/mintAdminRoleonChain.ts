import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { useMutation } from '@tanstack/react-query';
import NamespaceFactory from 'client/scripts/helpers/ContractHelpers/NamespaceFactory';

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
    0,
    1,
    adminAddress,
    chainId,
    walletAddress,
  );
};

const useMintAdminTokenMutation = () => {
  return useMutation({
    mutationFn: mintAdminToken,
  });
};

export default useMintAdminTokenMutation;
