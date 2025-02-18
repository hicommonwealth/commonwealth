import { useQuery } from '@tanstack/react-query';
import { ExternalEndpoints } from 'state/api/config';
import { CoinbaseResponseType, fetchTokenUsdRate } from './fetchTokenUsdRate';

const TOKENS_USD_RATE_STALE_TIME = 10 * 60 * 1_000; // 10 min

const fetchTokensUsdRate = async (tokenSymbols: string[]) => {
  const tokenRates = await Promise.all(
    tokenSymbols.map(async (symbol) => {
      try {
        const response = await fetchTokenUsdRate(symbol);
        return {
          ...response.data.data,
          symbol,
        };
      } catch {
        return null;
      }
    }),
  );

  return tokenRates.filter(Boolean);
};

type UseFetchTokensUsdRateQueryProps = {
  tokenSymbols: string[];
  enabled?: boolean;
};

const useFetchTokensUsdRateQuery = ({
  tokenSymbols,
  enabled,
}: UseFetchTokensUsdRateQueryProps) => {
  return useQuery<
    (CoinbaseResponseType['data']['data'] & { symbol: string })[]
  >({
    queryKey: [
      ExternalEndpoints.coinbase.tokenToUsdRate('TOKEN'),
      ...tokenSymbols,
    ],
    queryFn: () => fetchTokensUsdRate(tokenSymbols),
    staleTime: TOKENS_USD_RATE_STALE_TIME,
    enabled,
  });
};

export default useFetchTokensUsdRateQuery;
