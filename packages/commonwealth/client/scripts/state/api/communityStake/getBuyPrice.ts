import { factoryContracts, ValidChains } from '@hicommonwealth/chains';
import { useQuery } from '@tanstack/react-query';
import CommunityStakes from 'helpers/ContractHelpers/CommunityStakes';
import { ContractMethods } from 'state/api/config';

const GET_BUY_PRICE_STALE_TIME = 2 * 1_000; // 2 sec

type GetBuyPriceProps = Omit<UseGetBuyPriceQueryProps, 'apiEnabled'>;

const getBuyPrice = async ({
  namespace,
  stakeId,
  amount,
}: GetBuyPriceProps) => {
  const communityStakes = new CommunityStakes(
    factoryContracts[ValidChains.Goerli].communityStake,
    factoryContracts[ValidChains.Goerli].factory,
  );

  return await communityStakes.getBuyPrice(namespace, stakeId, amount);
};

interface UseGetBuyPriceQueryProps {
  namespace: string;
  stakeId: number;
  amount: number;
  apiEnabled: boolean;
}

const useGetBuyPriceQuery = ({
  namespace,
  stakeId,
  amount,
  apiEnabled,
}: UseGetBuyPriceQueryProps) => {
  return useQuery({
    queryKey: [ContractMethods.GET_BUY_PRICE, namespace, stakeId, amount],
    queryFn: () => getBuyPrice({ namespace, stakeId, amount }),
    enabled: apiEnabled,
    staleTime: GET_BUY_PRICE_STALE_TIME,
  });
};

export default useGetBuyPriceQuery;
