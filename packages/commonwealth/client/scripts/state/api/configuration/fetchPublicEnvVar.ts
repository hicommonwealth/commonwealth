import { GetPublicEnvVar } from '@hicommonwealth/schemas';
import { trpc, trpcQueryUtils } from 'utils/trpcClient';
import { z } from 'zod';

export const fetchCachedPublicEnvVar = () => {
  return trpcQueryUtils.configuration.getPublicEnvVar.getData();
};

export const fetchPublicEnvVarQuery = async (): Promise<
  z.infer<(typeof GetPublicEnvVar)['output']>
> => {
  return await trpcQueryUtils.configuration.getPublicEnvVar.fetch(undefined, {
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

const useFetchPublicEnvVarQuery = () => {
  return trpc.configuration.getPublicEnvVar.useQuery(undefined, {
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

export default useFetchPublicEnvVarQuery;
