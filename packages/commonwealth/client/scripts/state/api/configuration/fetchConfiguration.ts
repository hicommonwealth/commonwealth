import { useQuery } from '@tanstack/react-query';

import { queryClient, QueryKeys } from '../config';

const getConfiguration = async () => {
  return queryClient.getQueryData<{
    enforceSessionKeys: boolean;
    evmTestEnv: boolean;
  }>([QueryKeys.CONFIGURATION]);
};

const useFetchConfigurationQuery = () => {
  return useQuery({
    queryKey: [QueryKeys.CONFIGURATION],
    queryFn: () => getConfiguration(),
    staleTime: Infinity,
  });
};

export default useFetchConfigurationQuery;
