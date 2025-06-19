import { GetPublicEnvVar } from '@hicommonwealth/schemas';
import { getQueryKey } from '@trpc/react-query';
import axios from 'axios';
import { BASE_API_PATH, trpc } from 'utils/trpcClient';
import { z } from 'zod';
import { queryClient } from '../config';

export const fetchCachedPublicEnvVar = () => {
  const queryKey = getQueryKey(trpc.configuration.getPublicEnvVar);
  return queryClient.getQueryData<z.infer<(typeof GetPublicEnvVar)['output']>>(
    queryKey,
  );
};

export const fetchPublicEnvVar = async (): Promise<
  z.infer<(typeof GetPublicEnvVar)['output']>
> => {
  const queryKey = getQueryKey(trpc.configuration.getPublicEnvVar);
  const cache =
    queryClient.getQueryData<z.infer<(typeof GetPublicEnvVar)['output']>>(
      queryKey,
    );
  if (cache) return cache;

  // HACK: with @trpc/react-query v10.x, we can't directly call an endpoint outside of 'react-context'
  // with this way the api can be used in non-react files. This should be cleaned up when we migrate
  // to @trpc/react-query v11.x
  const { data } = await axios.get(
    `${BASE_API_PATH}/configuration.getPublicEnvVar`,
  );

  if (!data.result.data) {
    // TODO: this should never happen but how should we handle it if it does?
    throw new Error('No public env var returned from the API');
  }

  queryClient.setQueryData(queryKey, data.result.data);
  return data.result.data as z.infer<(typeof GetPublicEnvVar)['output']>;
};

const useFetchPublicEnvVarQuery = () => {
  return trpc.configuration.getPublicEnvVar.useQuery(undefined, {
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

export default useFetchPublicEnvVarQuery;
