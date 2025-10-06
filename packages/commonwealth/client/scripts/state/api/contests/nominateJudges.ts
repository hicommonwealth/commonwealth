import { factoryContracts } from '@hicommonwealth/evm-protocols';
import { useMutation } from '@tanstack/react-query';

import CommunityNominations from 'helpers/ContractHelpers/CommunityNominations';

export interface NominateJudgesProps {
  namespace: string;
  judges: string[];
  judgeId: number;
  walletAddress: string;
  ethChainId: number;
  chainRpc: string;
}

const nominateJudges = async ({
  namespace,
  judges,
  judgeId,
  walletAddress,
  ethChainId,
  chainRpc,
}: NominateJudgesProps) => {
  const contractAddress = factoryContracts[ethChainId]?.CommunityNominations;

  if (!contractAddress) {
    throw new Error(`Contract address not found for chain ID ${ethChainId}`);
  }

  const communityNominations = new CommunityNominations(
    contractAddress,
    chainRpc,
  );

  return await communityNominations.nominateJudge(
    namespace,
    judges,
    judgeId,
    walletAddress,
  );
};

const useNominateJudgesMutation = () => {
  return useMutation({
    mutationFn: nominateJudges,
  });
};

export default useNominateJudgesMutation;
