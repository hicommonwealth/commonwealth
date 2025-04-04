import { useMutation } from '@tanstack/react-query';

import { commonProtocol } from '@hicommonwealth/evm-protocols';
import NamespaceFactory from 'helpers/ContractHelpers/NamespaceFactory';

export interface ConfigureNominationsProps {
  namespaceName: string;
  creatorOnly: boolean;
  walletAddress: string;
  maxNominations?: number;
  ethChainId: number;
  chainRpc: string;
}

const configureNominations = async ({
  namespaceName,
  creatorOnly,
  walletAddress,
  maxNominations,
  ethChainId,
  chainRpc,
}: ConfigureNominationsProps) => {
  const factoryAddress = commonProtocol.factoryContracts[ethChainId]?.factory;
  const namespaceFactory = new NamespaceFactory(factoryAddress, chainRpc);

  return await namespaceFactory.configureNominations(
    namespaceName,
    creatorOnly,
    walletAddress,
    maxNominations,
  );
};

const useConfigureNominationsMutation = () => {
  return useMutation({
    mutationFn: configureNominations,
  });
};

export default useConfigureNominationsMutation;
