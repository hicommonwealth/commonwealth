import { useMutation } from '@tanstack/react-query';

import { factoryContracts } from '@hicommonwealth/evm-protocols';
import Contest from 'helpers/ContractHelpers/Contest';

export interface DeploySingleJudgedContestOnchainProps {
  ethChainId: number;
  chainRpc: string;
  namespaceName: string;
  contestInterval: number;
  winnerShares: number[];
  voterShare: number;
  walletAddress: string;
  exchangeToken: string;
  judgeId: number;
}

const deploySingleJudgedContestOnchain = async ({
  ethChainId,
  chainRpc,
  namespaceName,
  contestInterval,
  winnerShares,
  voterShare,
  walletAddress,
  exchangeToken,
  judgeId,
}: DeploySingleJudgedContestOnchainProps) => {
  const contest = new Contest(
    '',
    factoryContracts[ethChainId].factory,
    chainRpc,
    ethChainId,
  );

  return await contest.newSingleJudgedContest(
    namespaceName,
    contestInterval,
    winnerShares,
    voterShare,
    walletAddress,
    exchangeToken,
    judgeId,
  );
};

const useDeploySingleJudgedContestOnchainMutation = () => {
  return useMutation({
    mutationFn: deploySingleJudgedContestOnchain,
  });
};

export default useDeploySingleJudgedContestOnchainMutation;
