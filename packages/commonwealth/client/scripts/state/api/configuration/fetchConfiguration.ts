import { useQuery } from '@tanstack/react-query';

import { queryClient, QueryKeys } from '../config';

export const fetchConfiguration = async () => {
  return queryClient.getQueryData<{
    enforceSessionKeys: boolean;
    evmTestEnv: string;
  }>([QueryKeys.CONFIGURATION]);
};

const useFetchConfigurationQuery = () => {
  return useQuery({
    queryKey: [QueryKeys.CONFIGURATION],
    queryFn: () => fetchConfiguration(),
    staleTime: Infinity,
  });
};

export default useFetchConfigurationQuery;
