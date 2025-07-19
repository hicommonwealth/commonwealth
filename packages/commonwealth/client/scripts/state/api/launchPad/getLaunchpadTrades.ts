import { trpc } from 'utils/trpcClient';

const FETCH_TOKENS_STALE_TIME = 60 * 3_000; // 3 mins

type UseGetLaunchpadTradesProps = {
  trader_addresses: string[];
};

const useGetLaunchpadTradesQuery = ({
  trader_addresses,
}: UseGetLaunchpadTradesProps) => {
  return trpc.launchpadToken.getLaunchpadTrades.useQuery(
    {
      trader_addresses: trader_addresses.join(','),
    },
    {
      gcTime: FETCH_TOKENS_STALE_TIME,
    },
  );
};

export default useGetLaunchpadTradesQuery;
