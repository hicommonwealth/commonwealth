import { useMutation } from '@tanstack/react-query';

import { commonProtocol } from '@hicommonwealth/shared';
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
    commonProtocol.factoryContracts[ethChainId].factory,
    chainRpc,
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
