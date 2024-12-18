import { useQuery } from '@tanstack/react-query';

import { queryClient, QueryKeys } from '../config';

const CONFIGURATION_STALE_TIME = 5 * 60 * 1_000; // 5 min
const CONFIGURATION_CACHE_TIME = Infinity;

export type Configuration = {
  evmTestEnv: string;
  redirects: Record<string, string>;
};

export const fetchCachedConfiguration = () => {
  return queryClient.getQueryData<Configuration>([QueryKeys.CONFIGURATION]);
};

const useFetchConfigurationQuery = () => {
  return useQuery({
    queryKey: [QueryKeys.CONFIGURATION],
    queryFn: fetchCachedConfiguration,
    staleTime: CONFIGURATION_STALE_TIME,
    cacheTime: CONFIGURATION_CACHE_TIME,
  });
};

export default useFetchConfigurationQuery;
