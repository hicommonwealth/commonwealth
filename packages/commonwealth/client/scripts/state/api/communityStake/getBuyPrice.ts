import { commonProtocol } from '@hicommonwealth/shared';
import { useQuery } from '@tanstack/react-query';
import { ContractMethods } from 'state/api/config';
import { lazyLoadCommunityStakes } from '../../../helpers/ContractHelpers/LazyCommunityStakes';

const GET_BUY_PRICE_STALE_TIME = 2 * 1_000; // 2 sec

type GetBuyPriceProps = Omit<UseGetBuyPriceQueryProps, 'apiEnabled'>;

const getBuyPrice = async ({
  namespace,
  stakeId,
  amount,
  chainRpc,
  ethChainId,
}: GetBuyPriceProps) => {
  const CommunityStakes = await lazyLoadCommunityStakes();
  const communityStakes = new CommunityStakes(
    commonProtocol.factoryContracts[ethChainId].communityStake,
    commonProtocol.factoryContracts[ethChainId].factory,
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
  ethChainId: number;
}

const useGetBuyPriceQuery = ({
  namespace,
  stakeId,
  amount,
  apiEnabled,
  chainRpc,
  ethChainId,
  keepPreviousData = false,
}: UseGetBuyPriceQueryProps) => {
  return useQuery({
    queryKey: [
      ContractMethods.GET_BUY_PRICE,
      namespace,
      stakeId,
      amount,
      chainRpc,
      ethChainId,
    ],
    queryFn: () =>
      getBuyPrice({ namespace, stakeId, amount, chainRpc, ethChainId }),
    enabled: apiEnabled,
    staleTime: GET_BUY_PRICE_STALE_TIME,
    keepPreviousData,
  });
};

export default useGetBuyPriceQuery;
