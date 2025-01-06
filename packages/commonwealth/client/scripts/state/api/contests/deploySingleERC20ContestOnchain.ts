import { useMutation } from '@tanstack/react-query';

import { commonProtocol } from '@hicommonwealth/evm-protocols';
import Contest from 'helpers/ContractHelpers/Contest';

export interface DeploySingleERC20ContestOnchainProps {
  ethChainId: number;
  chainRpc: string;
  namespaceName: string;
  contestInterval: number;
  winnerShares: number[];
  voteToken: string;
  voterShare: number;
  walletAddress: string;
  exchangeToken: string;
}

const deploySingleERC20ContestOnchain = async ({
  ethChainId,
  chainRpc,
  namespaceName,
  contestInterval,
  winnerShares,
  voteToken,
  voterShare,
  walletAddress,
  exchangeToken,
}: DeploySingleERC20ContestOnchainProps) => {
  const contest = new Contest(
    '',
    commonProtocol.factoryContracts[ethChainId].factory,
    chainRpc,
  );

  return await contest.newSingleERC20Contest(
    namespaceName,
    contestInterval,
    winnerShares,
    voteToken,
    voterShare,
    walletAddress,
    exchangeToken,
  );
};

const useDeploySingleERC20ContestOnchainMutation = () => {
  return useMutation({
    mutationFn: deploySingleERC20ContestOnchain,
  });
};

export default useDeploySingleERC20ContestOnchainMutation;
