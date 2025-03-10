import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ExternalEndpoints } from 'state/api/config';

const TOKEN_USD_RATE_STALE_TIME = 10 * 60 * 1_000; // 10 min

export type DefiLlamaCoinPriceResponse = {
  decimals: number;
  symbol: string;
  price: number;
  timestamp: number;
  confidence: number;
};

export type DefiLlamaResponseType = {
  coins: {
    [key: string]: DefiLlamaCoinPriceResponse;
  };
};

export const fetchTokenUsdRate = async (tokenContractAddress: string) => {
  return await axios.get(
    ExternalEndpoints.defiLlama.tokenToUsdRate(tokenContractAddress),
  );
};

type UseFetchTokenUsdRateQueryProps = {
  tokenContractAddress: string; // `0x....xx`
  enabled?: boolean;
};

const useFetchTokenUsdRateQuery = ({
  tokenContractAddress,
  enabled,
}: UseFetchTokenUsdRateQueryProps) => {
  return useQuery({
    queryKey: [
      ExternalEndpoints.defiLlama.tokenToUsdRate(tokenContractAddress),
    ],
    queryFn: () => fetchTokenUsdRate(tokenContractAddress),
    staleTime: TOKEN_USD_RATE_STALE_TIME,
    enabled,
  });
};

export default useFetchTokenUsdRateQuery;
