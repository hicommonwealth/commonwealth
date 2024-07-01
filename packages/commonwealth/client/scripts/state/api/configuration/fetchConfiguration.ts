import { useQuery } from '@tanstack/react-query';

import { queryClient, QueryKeys } from '../config';

export type Configuration = {
  enforceSessionKeys: boolean;
  evmTestEnv: string;
  redirects: Record<string, string>;
};

export const fetchConfiguration = async () => {
  return queryClient.getQueryData<Configuration>([QueryKeys.CONFIGURATION]);
};

const useFetchConfigurationQuery = () => {
  return useQuery({
    queryKey: [QueryKeys.CONFIGURATION],
    queryFn: () => fetchConfiguration(),
    staleTime: Infinity,
  });
};

export default useFetchConfigurationQuery;
