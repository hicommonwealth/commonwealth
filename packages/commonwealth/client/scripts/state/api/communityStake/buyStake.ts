import { factoryContracts, ValidChains } from '@hicommonwealth/chains';
import { useMutation } from '@tanstack/react-query';
import CommunityStakes from 'helpers/ContractHelpers/CommunityStakes';

interface BuyStakeProps {
  namespace: string;
  stakeId: number;
  amount: number;
}

const buyStake = async ({ namespace, stakeId, amount }: BuyStakeProps) => {
  const communityStakes = new CommunityStakes(
    factoryContracts[ValidChains.Goerli].communityStake,
    factoryContracts[ValidChains.Goerli].factory,
  );

  return await communityStakes.buyStake(namespace, stakeId, amount);
};

const useBuyStakeMutation = () => {
  return useMutation({
    mutationFn: buyStake,
    onSuccess: async () => {
      // TODO invalidate queries
      console.log('buy stake success');
    },
  });
};

export default useBuyStakeMutation;
