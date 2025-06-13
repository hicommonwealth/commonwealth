import { GetTokenStats } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

export const useGetTokenStatsQuery = (
  input: z.infer<typeof GetTokenStats.input>,
  options?: Parameters<typeof trpc.launchpadToken.getTokenStats.useQuery>[1],
) => {
  return trpc.launchpadToken.getTokenStats.useQuery(input, options);
};
