import { commonProtocol } from '@hicommonwealth/core';
import { useMutation } from '@tanstack/react-query';
import { ContractMethods, queryClient } from 'state/api/config';
import { setActiveAccountOnTransactionSuccess } from 'views/modals/ManageCommunityStakeModal/utils';
import { lazyLoadCommunityStakes } from '../../../helpers/ContractHelpers/LazyCommunityStakes';

interface SellStakeProps {
  namespace: string;
  stakeId: number;
  amount: number;
  chainRpc: string;
  walletAddress: string;
  ethChainId: number;
}

const sellStake = async ({
  namespace,
  stakeId,
  amount,
  chainRpc,
  walletAddress,
  ethChainId,
}: SellStakeProps) => {
  const CommunityStakes = await lazyLoadCommunityStakes();
  const communityStakes = new CommunityStakes(
    commonProtocol.factoryContracts[ethChainId].communityStake,
    commonProtocol.factoryContracts[ethChainId].factory,
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
