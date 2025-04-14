import { useMutation } from '@tanstack/react-query';

import { commonProtocol } from '@hicommonwealth/evm-protocols';
import NamespaceFactory from 'helpers/ContractHelpers/NamespaceFactory';

export interface ConfigureNominationsProps {
  namespaceName: string;
  creatorOnly: boolean;
  walletAddress: string;
  judgeId: number;
  maxNominations?: number;
  ethChainId: number;
  chainRpc: string;
}

const configureNominations = async ({
  namespaceName,
  creatorOnly,
  walletAddress,
  judgeId,
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
    judgeId,
    maxNominations,
  );
};

const useConfigureNominationsMutation = () => {
  return useMutation({
    mutationFn: configureNominations,
  });
};

export default useConfigureNominationsMutation;
