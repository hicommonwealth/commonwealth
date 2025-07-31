import { GetThreadToken } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

const FETCH_TOKEN_STALE_TIME = 60 * 3_000; // 3 mins

type UseGetThreadToken = z.infer<typeof GetThreadToken.input> & {
  enabled?: boolean;
};

const useGetThreadToken = ({ thread_id, enabled }: UseGetThreadToken) => {
  return trpc.launchpadToken.getThreadToken.useQuery(
    {
      thread_id,
    },
    {
      staleTime: FETCH_TOKEN_STALE_TIME,
      enabled,
    },
  );
};

export default useGetThreadToken;
