import { useMutation } from '@tanstack/react-query';

import { commonProtocol } from '@hicommonwealth/shared';
import Contest from 'helpers/ContractHelpers/Contest';

interface DeployRecurringContestOnchainProps {
  ethChainId: number;
  chainRpc: string;
  namespaceName: string;
  contestInterval: number;
  winnerShares: number[];
  stakeId: 2;
  prizeShare: number;
  voterShare: 20;
  feeShare: 100;
  weight: 1;
  walletAddress: string;
}

const deployRecurringContestOnchain = async ({
  ethChainId,
  chainRpc,
  namespaceName,
  contestInterval,
  winnerShares,
  stakeId,
  prizeShare,
  voterShare,
  feeShare,
  weight,
  walletAddress,
}: DeployRecurringContestOnchainProps) => {
  const contest = new Contest(
    commonProtocol.factoryContracts[ethChainId].communityStake,
    commonProtocol.factoryContracts[ethChainId].factory,
    chainRpc,
  );

  return await contest.newRecurringContest(
    namespaceName,
    contestInterval,
    winnerShares,
    stakeId,
    prizeShare,
    voterShare,
    feeShare,
    weight,
    walletAddress,
  );
};

interface UseDeployRecurringContestOnchainMutationProps {}

const useDeployRecurringContestOnchainMutation =
  ({}: UseDeployRecurringContestOnchainMutationProps) => {
    return useMutation({
      mutationFn: deployRecurringContestOnchain,
      onSuccess: async () => {
        console.log('deployRecurringContestOnchain success');
      },
    });
  };

export default useDeployRecurringContestOnchainMutation;
