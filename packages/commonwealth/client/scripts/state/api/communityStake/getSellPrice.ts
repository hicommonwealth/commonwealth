import { commonProtocol } from '@hicommonwealth/shared';
import { useQuery } from '@tanstack/react-query';
import { ContractMethods } from 'state/api/config';
import { lazyLoadCommunityStakes } from '../../../helpers/ContractHelpers/LazyCommunityStakes';

const GET_SELL_PRICE_STALE_TIME = 2 * 1_000; // 2 sec

type GetSellPriceProps = Omit<UseGetSellPriceQueryProps, 'apiEnabled'>;

const getSellPrice = async ({
  namespace,
  stakeId,
  amount,
  chainRpc,
  ethChainId,
}: GetSellPriceProps) => {
  const CommunityStakes = await lazyLoadCommunityStakes();
  const communityStakes = new CommunityStakes(
    commonProtocol.factoryContracts[ethChainId].communityStake,
    commonProtocol.factoryContracts[ethChainId].factory,
    chainRpc,
  );

  return await communityStakes.getSellPrice(namespace, stakeId, amount);
};

interface UseGetSellPriceQueryProps {
  namespace: string;
  stakeId: number;
  amount: number;
  apiEnabled: boolean;
  chainRpc: string;
  ethChainId: number;
}

const useGetSellPriceQuery = ({
  namespace,
  stakeId,
  amount,
  apiEnabled,
  chainRpc,
  ethChainId,
}: UseGetSellPriceQueryProps) => {
  return useQuery({
    queryKey: [
      ContractMethods.GET_SELL_PRICE,
      namespace,
      stakeId,
      amount,
      chainRpc,
      ethChainId,
    ],
    queryFn: () =>
      getSellPrice({ namespace, stakeId, amount, chainRpc, ethChainId }),
    enabled: apiEnabled,
    staleTime: GET_SELL_PRICE_STALE_TIME,
  });
};

export default useGetSellPriceQuery;
