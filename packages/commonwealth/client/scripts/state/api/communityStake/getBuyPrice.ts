import { commonProtocol } from '@hicommonwealth/core';
import { useQuery } from '@tanstack/react-query';
import CommunityStakes from 'helpers/ContractHelpers/CommunityStakes';
import { ContractMethods } from 'state/api/config';

const GET_BUY_PRICE_STALE_TIME = 2 * 1_000; // 2 sec

type GetBuyPriceProps = Omit<UseGetBuyPriceQueryProps, 'apiEnabled'>;

const getBuyPrice = async ({
  namespace,
  stakeId,
  amount,
  chainRpc,
}: GetBuyPriceProps) => {
  const communityStakes = new CommunityStakes(
    commonProtocol.factoryContracts[
      commonProtocol.ValidChains.Sepolia
    ].communityStake,
    commonProtocol.factoryContracts[commonProtocol.ValidChains.Sepolia].factory,
    chainRpc,
  );

  return await communityStakes.getBuyPrice(namespace, stakeId, amount);
};

interface UseGetBuyPriceQueryProps {
  namespace: string;
  stakeId: number;
  amount: number;
  apiEnabled: boolean;
  chainRpc: string;
  keepPreviousData?: boolean;
}

const useGetBuyPriceQuery = ({
  namespace,
  stakeId,
  amount,
  apiEnabled,
  chainRpc,
  keepPreviousData = false,
}: UseGetBuyPriceQueryProps) => {
  return useQuery({
    queryKey: [
      ContractMethods.GET_BUY_PRICE,
      namespace,
      stakeId,
      amount,
      chainRpc,
    ],
    queryFn: () => getBuyPrice({ namespace, stakeId, amount, chainRpc }),
    enabled: apiEnabled,
    staleTime: GET_BUY_PRICE_STALE_TIME,
    keepPreviousData,
  });
};

export default useGetBuyPriceQuery;
