import { commonProtocol } from '@hicommonwealth/core';
import { useQuery } from '@tanstack/react-query';
import CommunityStakes from 'helpers/ContractHelpers/CommunityStakes';
import { ContractMethods } from 'state/api/config';

const GET_SELL_PRICE_STALE_TIME = 2 * 1_000; // 2 sec

type GetSellPriceProps = Omit<UseGetSellPriceQueryProps, 'apiEnabled'>;

const getSellPrice = async ({
  namespace,
  stakeId,
  amount,
  chainRpc,
}: GetSellPriceProps) => {
  const communityStakes = new CommunityStakes(
    commonProtocol.factoryContracts[
      commonProtocol.ValidChains.Sepolia
    ].communityStake,
    commonProtocol.factoryContracts[commonProtocol.ValidChains.Sepolia].factory,
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
}

const useGetSellPriceQuery = ({
  namespace,
  stakeId,
  amount,
  apiEnabled,
  chainRpc,
}: UseGetSellPriceQueryProps) => {
  return useQuery({
    queryKey: [
      ContractMethods.GET_SELL_PRICE,
      namespace,
      stakeId,
      amount,
      chainRpc,
    ],
    queryFn: () => getSellPrice({ namespace, stakeId, amount, chainRpc }),
    enabled: apiEnabled,
    staleTime: GET_SELL_PRICE_STALE_TIME,
  });
};

export default useGetSellPriceQuery;
