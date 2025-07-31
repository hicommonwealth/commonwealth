import { getFactoryContract } from '@hicommonwealth/evm-protocols';
import { useMutation } from '@tanstack/react-query';

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
    getFactoryContract(ethChainId).NamespaceFactory,
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
