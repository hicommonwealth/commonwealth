import { useMutation } from '@tanstack/react-query';

import { commonProtocol } from '@hicommonwealth/shared';
import Contest from 'helpers/ContractHelpers/Contest';

interface DeployRecurringContestOnchainProps {
  ethChainId: number;
  chainRpc: string;
  namespaceName: string;
  contestInterval: number;
  winnerShares: number[];
  stakeId: number;
  prizeShare: number;
  voterShare: number;
  feeShare: number;
  weight: number;
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
    '',
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

const useDeployRecurringContestOnchainMutation = () => {
  return useMutation({
    mutationFn: deployRecurringContestOnchain,
  });
};

export default useDeployRecurringContestOnchainMutation;
