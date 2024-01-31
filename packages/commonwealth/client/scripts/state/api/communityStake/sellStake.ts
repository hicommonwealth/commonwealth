import { factoryContracts, ValidChains } from '@hicommonwealth/chains';
import { useMutation } from '@tanstack/react-query';
import CommunityStakes from 'helpers/ContractHelpers/CommunityStakes';

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
    onSuccess: async () => {
      // TODO invalidate queries
      console.log('sell stake success');
    },
  });
};

export default useSellStakeMutation;
