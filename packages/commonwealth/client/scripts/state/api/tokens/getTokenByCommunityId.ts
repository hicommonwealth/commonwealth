import { GetToken } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

const FETCH_TOKEN_STALE_TIME = 60 * 3_000; // 3 mins

type UseFetchTokensProps = z.infer<typeof GetToken.input> & {
  enabled?: boolean;
};

const useGetTokenByCommunityId = ({
  community_id,
  with_stats = true,
  enabled,
}: UseFetchTokensProps) => {
  return trpc.token.getToken.useInfiniteQuery(
    {
      community_id,
      with_stats,
    },
    {
      staleTime: FETCH_TOKEN_STALE_TIME,
      enabled,
    },
  );
};

export default useGetTokenByCommunityId;
