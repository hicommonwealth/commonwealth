import { GetTokenStats } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

const FETCH_TOKEN_STATS_STALE_TIME = 30_000; // 30 seconds
const FETCH_TOKEN_STATS_REFETCH_INTERVAL = 30_000; // 30 seconds

export const useGetTokenStatsQuery = (
  input: z.infer<typeof GetTokenStats.input>,
  options?: Parameters<typeof trpc.LaunchpadToken.getTokenStats.useQuery>[1],
) => {
  return trpc.LaunchpadToken.getTokenStats.useQuery(input, {
    staleTime: FETCH_TOKEN_STATS_STALE_TIME,
    refetchInterval: FETCH_TOKEN_STATS_REFETCH_INTERVAL,
    ...options,
  });
};
