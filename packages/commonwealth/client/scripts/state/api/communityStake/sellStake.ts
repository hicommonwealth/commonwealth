import { factoryContracts, ValidChains } from '@hicommonwealth/chains';
import { useMutation } from '@tanstack/react-query';
import CommunityStakes from 'helpers/ContractHelpers/CommunityStakes';
import { ContractMethods, queryClient } from 'state/api/config';
import { setActiveAccountOnTransactionSuccess } from 'views/modals/ManageCommunityStakeModal/utils';

interface SellStakeProps {
  namespace: string;
  stakeId: number;
  amount: number;
  chainRpc: string;
  walletAddress: string;
}

const sellStake = async ({
  namespace,
  stakeId,
  amount,
  chainRpc,
  walletAddress,
}: SellStakeProps) => {
  const communityStakes = new CommunityStakes(
    factoryContracts[ValidChains.Goerli].communityStake,
    factoryContracts[ValidChains.Goerli].factory,
    chainRpc,
  );

  return await communityStakes.sellStake(
    namespace,
    stakeId,
    amount,
    walletAddress,
  );
};

const useSellStakeMutation = () => {
  return useMutation({
    mutationFn: sellStake,
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
      await setActiveAccountOnTransactionSuccess(variables.walletAddress);
    },
  });
};

export default useSellStakeMutation;
