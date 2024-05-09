import { useMutation } from '@tanstack/react-query';

import { commonProtocol } from '@hicommonwealth/shared';
import Contest from 'helpers/ContractHelpers/Contest';

interface FundContestOnchainProps {
  ethChainId: number;
  chainRpc: string;
  amount: number;
  walletAddress: string;
}

const fundContestOnchain = async ({
  ethChainId,
  chainRpc,
  amount,
  walletAddress,
}: FundContestOnchainProps) => {
  const contest = new Contest(
    commonProtocol.factoryContracts[ethChainId].communityStake,
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
