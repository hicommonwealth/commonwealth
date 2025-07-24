import { useMutation } from '@tanstack/react-query';

import { factoryContracts } from '@hicommonwealth/evm-protocols';
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
  const factoryAddress = factoryContracts[ethChainId]?.factory;
  const namespaceFactory = new NamespaceFactory(factoryAddress, chainRpc);

  const txReceipt = await namespaceFactory.configureNominations(
    namespaceName,
    creatorOnly,
    walletAddress,
    judgeId,
    maxNominations,
  );

  return { txReceipt, judgeId };
};

const useConfigureNominationsMutation = () => {
  const { mutate: configureNominationsMetadata } =
    trpc.contest.configureNominationsMetadata.useMutation();

  return useMutation({
    mutationFn: configureNominations,
    onSuccess: (data) => {
      const communityId = app.activeChainId();
      if (communityId) {
        configureNominationsMetadata({
          community_id: communityId,
          judge_token_id: data.judgeId,
        });
      }
    },
  });
};

export default useConfigureNominationsMutation;
