import { getFactoryContract } from '@hicommonwealth/evm-protocols';
import { useMutation } from '@tanstack/react-query';

import Contest from 'helpers/ContractHelpers/Contest';
import { ContractMethods, queryClient } from 'state/api/config';

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
    getFactoryContract(ethChainId).NamespaceFactory,
    chainRpc,
    ethChainId,
  );

  return await contest.deposit(amount, walletAddress);
};

const useFundContestOnchainMutation = () => {
  return useMutation({
    mutationFn: fundContestOnchain,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [
          ContractMethods.GET_CONTEST_BALANCE,
          variables.contestAddress,
          variables.chainRpc,
          variables.ethChainId,
        ],
      });
    },
  });
};

export default useFundContestOnchainMutation;
