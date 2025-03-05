import { useQuery } from '@tanstack/react-query';
import { ExternalEndpoints } from 'state/api/config';
import {
  DefiLlamaCoinPriceResponse,
  fetchTokenUsdRate,
} from './fetchTokenUsdRate';

const TOKENS_USD_RATE_STALE_TIME = 10 * 60 * 1_000; // 10 min

const fetchTokensUsdRate = async (tokenContractAddresses: string[]) => {
  const tokenRates = await Promise.all(
    tokenContractAddresses.map(async (address) => {
      try {
        const response = await fetchTokenUsdRate(address);
        if (!response.data.coins[`base:${address}`])
          throw new Error('Price not found');
        return {
          ...response.data.coins[`base:${address}`],
          address,
        };
      } catch {
        return null;
      }
    }),
  );

  return tokenRates.filter(Boolean);
};

type UseFetchTokensUsdRateQueryProps = {
  tokenContractAddresses: string[];
  enabled?: boolean;
};

const useFetchTokensUsdRateQuery = ({
  tokenContractAddresses,
  enabled,
}: UseFetchTokensUsdRateQueryProps) => {
  return useQuery<(DefiLlamaCoinPriceResponse & { address: string })[]>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      ...tokenContractAddresses.map((address) =>
        ExternalEndpoints.defiLlama.tokenToUsdRate(address),
      ),
    ],
    queryFn: () => fetchTokensUsdRate(tokenContractAddresses),
    staleTime: TOKENS_USD_RATE_STALE_TIME,
    enabled,
  });
};

export default useFetchTokensUsdRateQuery;
