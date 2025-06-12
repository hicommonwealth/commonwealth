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

export const fetchPublicEnvVar = async () => {
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

  data && queryClient.setQueryData(queryKey, data);
  return data;
};
