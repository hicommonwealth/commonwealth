import { trpc } from 'utils/trpcClient';

const FETCH_TOKENS_STALE_TIME = 60 * 3_000; // 3 mins

type UseGetLaunchpadTradesProps = {
  user_id: number;
};

const useGetLaunchpadTradesQuery = ({
  user_id,
}: UseGetLaunchpadTradesProps) => {
  return trpc.launchpadToken.getLaunchpadTrades.useQuery(
    {
      user_id,
    },
    {
      gcTime: FETCH_TOKENS_STALE_TIME,
    },
  );
};

export default useGetLaunchpadTradesQuery;
