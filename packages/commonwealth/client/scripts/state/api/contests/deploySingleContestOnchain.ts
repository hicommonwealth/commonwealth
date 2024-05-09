import { useMutation } from '@tanstack/react-query';

import { commonProtocol } from '@hicommonwealth/shared';
import Contest from 'helpers/ContractHelpers/Contest';

interface DeploySingleContestOnchainProps {
  ethChainId: number;
  chainRpc: string;
  namespaceName: string;
  contestLength: number;
  winnerShares: number[];
  stakeId: number;
  voterShare: number;
  weight: number;
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
    '',
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

const useDeploySingleContestOnchainMutation = () => {
  return useMutation({
    mutationFn: deploySingleContestOnchain,
  });
};

export default useDeploySingleContestOnchainMutation;
