import { commonProtocol } from '@hicommonwealth/shared';
import { useMutation } from '@tanstack/react-query';
import { ContractMethods, queryClient } from 'state/api/config';
import { setActiveAccountOnTransactionSuccess } from 'views/modals/ManageCommunityStakeModal/utils';
import { lazyLoadCommunityStakes } from '../../../helpers/ContractHelpers/LazyCommunityStakes';

interface BuyStakeProps {
  namespace: string;
  stakeId: number;
  amount: number;
  chainRpc: string;
  walletAddress: string;
  ethChainId: number;
  chainId?: string;
}

const buyStake = async ({
  namespace,
  stakeId,
  amount,
  chainRpc,
  walletAddress,
  ethChainId,
  chainId,
}: BuyStakeProps) => {
  const CommunityStakes = await lazyLoadCommunityStakes();
  const communityStakes = new CommunityStakes(
    commonProtocol.factoryContracts[ethChainId].communityStake,
    commonProtocol.factoryContracts[ethChainId].factory,
    chainRpc,
    chainId,
  );

  return await communityStakes.buyStake(
    namespace,
    stakeId,
    amount,
    walletAddress,
  );
};

interface UseBuyStakeMutationProps {
  shouldUpdateActiveAddress?: boolean;
}

const useBuyStakeMutation = ({
  shouldUpdateActiveAddress = true,
}: UseBuyStakeMutationProps) => {
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
      if (shouldUpdateActiveAddress) {
        await setActiveAccountOnTransactionSuccess(variables.walletAddress);
      }
    },
  });
};

export default useBuyStakeMutation;
