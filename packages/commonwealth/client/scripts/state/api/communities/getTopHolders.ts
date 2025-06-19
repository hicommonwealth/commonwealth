import { trpc } from 'utils/trpcClient';

export type GetTopHoldersProps = {
  community_id: string;
  limit?: number;
  apiEnabled?: boolean;
  shouldPolling?: boolean;
};

const TOP_HOLDERS_STALE_TIME = 10 * 1_000; // 10 s

export const useGetTopHoldersQuery = ({
  community_id,
  limit = 30,
  apiEnabled = true,
  shouldPolling = false,
}: GetTopHoldersProps) => {
  return trpc.community.getTopHolders.useQuery(
    { community_id, limit },
    {
      enabled: apiEnabled,
      staleTime: TOP_HOLDERS_STALE_TIME,
      refetchInterval: shouldPolling ? TOP_HOLDERS_STALE_TIME : false,
    },
  );
};
