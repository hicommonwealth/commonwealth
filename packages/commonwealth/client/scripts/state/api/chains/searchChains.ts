import { SearchCommunities } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import z from 'zod';

const SEARCH_CHAINS_STALE_TIME = 2 * 60 * 60 * 1_000; // 2 h

const useSearchChainsQuery = ({
  search,
  limit,
  order_by,
  order_direction,
  enabled = true,
}: z.infer<(typeof SearchCommunities)['input']> & { enabled?: boolean }) => {
  return trpc.community.searchCommunities.useInfiniteQuery(
    {
      search,
      limit,
      order_by,
      order_direction,
    },
    {
      getNextPageParam: (lastPage) => {
        const nextPageNum = lastPage.page + 1;
        if (nextPageNum <= lastPage.totalPages) {
          return nextPageNum;
        }
        return undefined;
      },
      staleTime: SEARCH_CHAINS_STALE_TIME,
      enabled,
    },
  );
};

export default useSearchChainsQuery;
