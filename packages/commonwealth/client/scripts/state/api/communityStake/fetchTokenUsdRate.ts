import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ExternalEndpoints } from 'state/api/config';

const TOKEN_USD_RATE_STALE_TIME = 10 * 60 * 1_000; // 10 min

export type CoinbaseResponseType = {
  data: {
    data: {
      amount: string;
      base: string;
      currency: string;
    };
  };
};

export const fetchTokenUsdRate = async (tokenSymbol: string) => {
  return await axios.get(
    ExternalEndpoints.coinbase.tokenToUsdRate(tokenSymbol),
  );
};

type UseFetchTokenUsdRateQueryProps = {
  tokenSymbol: string; // any token symbol ex: `ETH`, `SUSHI`, `DOGE` etc.
  enabled?: boolean;
};

const useFetchTokenUsdRateQuery = ({
  tokenSymbol,
  enabled,
}: UseFetchTokenUsdRateQueryProps) => {
  return useQuery<CoinbaseResponseType>({
    queryKey: [ExternalEndpoints.coinbase.tokenToUsdRate(tokenSymbol)],
    queryFn: () => fetchTokenUsdRate(tokenSymbol),
    staleTime: TOKEN_USD_RATE_STALE_TIME,
    enabled,
  });
};

export default useFetchTokenUsdRateQuery;
