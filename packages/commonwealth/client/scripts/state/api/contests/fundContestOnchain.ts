import { useMutation } from '@tanstack/react-query';

import { commonProtocol } from '@hicommonwealth/shared';
import Contest from 'helpers/ContractHelpers/Contest';

interface FundContestOnchainProps {
  contestAddress: string;
  ethChainId: number;
  chainRpc: string;
  amount: number;
  walletAddress: string;
}

const fundContestOnchain = async ({
  contestAddress,
  ethChainId,
  chainRpc,
  amount,
  walletAddress,
}: FundContestOnchainProps) => {
  const contest = new Contest(
    contestAddress,
    commonProtocol.factoryContracts[ethChainId].factory,
    chainRpc,
  );

  return await contest.deposit(amount, walletAddress);
};

const useFundContestOnchainMutation = () => {
  return useMutation({
    mutationFn: fundContestOnchain,
  });
};

export default useFundContestOnchainMutation;
