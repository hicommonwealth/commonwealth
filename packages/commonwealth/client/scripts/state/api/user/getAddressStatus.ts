import { trpc } from 'utils/trpcClient';

const GET_ADDRESS_STATUS_STALE_TIME = 60 * 1_000; // 1 minute

export function useGetAddressStatusQuery({
  community_id,
  address,
}: {
  community_id: string;
  address: string;
}) {
  return trpc.user.getAddressStatus.useQuery(
    { community_id: community_id, address },
    {
      enabled: !!community_id && !!address,
      staleTime: GET_ADDRESS_STATUS_STALE_TIME,
    },
  );
}
