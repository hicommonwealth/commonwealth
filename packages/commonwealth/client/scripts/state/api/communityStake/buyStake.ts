import { factoryContracts, ValidChains } from '@hicommonwealth/chains';
import { useMutation } from '@tanstack/react-query';
import CommunityStakes from 'helpers/ContractHelpers/CommunityStakes';
import { ContractMethods, queryClient } from 'state/api/config';

interface BuyStakeProps {
  namespace: string;
  stakeId: number;
  amount: number;
  chainRpc: string;
  walletAddress: string;
}

const buyStake = async ({
  namespace,
  stakeId,
  amount,
  chainRpc,
  walletAddress,
}: BuyStakeProps) => {
  const communityStakes = new CommunityStakes(
    factoryContracts[ValidChains.Goerli].communityStake,
    factoryContracts[ValidChains.Goerli].factory,
    chainRpc,
  );

  return await communityStakes.buyStake(
    namespace,
    stakeId,
    amount,
    walletAddress,
  );
};

const useBuyStakeMutation = () => {
  return useMutation({
    mutationFn: buyStake,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [
          ContractMethods.GET_USER_STAKE_BALANCE,
          variables.namespace,
          variables.stakeId,
          variables.chainRpc,
          variables.walletAddress,
        ],
      });
    },
  });
};

export default useBuyStakeMutation;
