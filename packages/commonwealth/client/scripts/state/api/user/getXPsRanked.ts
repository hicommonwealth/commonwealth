import { GetXpsRanked } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

const FETCH_XP_RANKED_STALE_TIME = 60 * 3_000; // 3 mins
const FETCH_XP_RANKED_CACHE_TIME = 60 * 5_000; // 5 mins

type UseGetXPsRankedProps = z.infer<typeof GetXpsRanked.input> & {
  enabled?: boolean;
};

const useGetXPsRanked = ({
  top = 100,
  quest_id,
  enabled = true,
}: UseGetXPsRankedProps) => {
  return trpc.user.getXpsRanked.useQuery(
    {
      top,
      quest_id,
    },
    {
      enabled,
      staleTime: FETCH_XP_RANKED_STALE_TIME,
      //cacheTime: FETCH_XP_RANKED_CACHE_TIME,
    },
  );
};

export default useGetXPsRanked;
