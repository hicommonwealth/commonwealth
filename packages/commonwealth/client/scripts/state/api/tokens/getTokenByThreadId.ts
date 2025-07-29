import { GetThreadToken } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

const FETCH_TOKEN_STALE_TIME = 60 * 3_000; // 3 mins

type UseGetTokenByThreadIdProps = z.infer<typeof GetThreadToken.input> & {
  enabled?: boolean;
};

const useGetTokenByThreadId = ({
  thread_id,
  with_stats = true,
  enabled,
}: UseGetTokenByThreadIdProps) => {
  return trpc.launchpadToken.getThreadToken.useQuery(
    {
      thread_id,
      with_stats,
    },
    {
      staleTime: FETCH_TOKEN_STALE_TIME,
      enabled,
    },
  );
};

export default useGetTokenByThreadId;
