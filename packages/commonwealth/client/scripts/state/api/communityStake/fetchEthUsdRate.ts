import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ExternalEndpoints } from 'state/api/config';

const ETH_USD_RATE_STALE_TIME = 10 * 60 * 1_000; // 10 min

type CoinbaseResponseType = {
  data: {
    data: {
      amount: string;
      base: string;
      currency: string;
    };
  };
};

const fetchEthUsdRate = async () => {
  return await axios.get(ExternalEndpoints.coinbase.ethToUsdRate);
};

const useFetchEthUsdRateQuery = () => {
  return useQuery<CoinbaseResponseType>({
    queryKey: [ExternalEndpoints.coinbase],
    queryFn: fetchEthUsdRate,
    staleTime: ETH_USD_RATE_STALE_TIME,
  });
};

export default useFetchEthUsdRateQuery;
