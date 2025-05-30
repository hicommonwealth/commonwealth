import { useMutation } from '@tanstack/react-query';

import { commonProtocol } from '@hicommonwealth/evm-protocols';
import NamespaceFactory from 'helpers/ContractHelpers/NamespaceFactory';
import app from 'state';
import { trpc } from 'utils/trpcClient';

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

  const txReceipt = await namespaceFactory.configureNominations(
    namespaceName,
    creatorOnly,
    walletAddress,
    judgeId,
    maxNominations,
  );

  const { mutate: configureNominationsMetadata } =
    trpc.contest.configureNominationsMetadata.useMutation();

  const communityId = app.activeChainId();
  if (communityId) {
    await configureNominationsMetadata({
      community_id: communityId,
      judge_token_id: judgeId,
    });
  }

  return txReceipt;
};

const useConfigureNominationsMutation = () => {
  return useMutation({
    mutationFn: configureNominations,
  });
};

export default useConfigureNominationsMutation;
