import { useMutation } from '@tanstack/react-query';

import { commonProtocol } from '@hicommonwealth/shared';
import Contest from 'helpers/ContractHelpers/Contest';

interface DeploySingleContestOnchainProps {
  ethChainId: number;
  chainRpc: string;
  namespaceName: string;
  contestLength: number;
  winnerShares: number[];
  stakeId: 2;
  voterShare: 20;
  weight: 1;
  walletAddress: string;
  exchangeToken: string;
}

const deploySingleContestOnchain = async ({
  ethChainId,
  chainRpc,
  namespaceName,
  contestLength,
  winnerShares,
  stakeId,
  voterShare,
  weight,
  walletAddress,
  exchangeToken,
}: DeploySingleContestOnchainProps) => {
  const contest = new Contest(
    commonProtocol.factoryContracts[ethChainId].communityStake,
    commonProtocol.factoryContracts[ethChainId].factory,
    chainRpc,
  );

  return await contest.newSingleContest(
    namespaceName,
    contestLength,
    winnerShares,
    stakeId,
    voterShare,
    weight,
    walletAddress,
    exchangeToken,
  );
};

interface UseDeploySingleContestOnchainMutationProps {}

const useDeploySingleContestOnchainMutation =
  ({}: UseDeploySingleContestOnchainMutationProps) => {
    return useMutation({
      mutationFn: deploySingleContestOnchain,
      onSuccess: async () => {
        console.log('deploySingleContestOnchain success');
      },
    });
  };

export default useDeploySingleContestOnchainMutation;
