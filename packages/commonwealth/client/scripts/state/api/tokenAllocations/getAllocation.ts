import { trpc } from 'utils/trpcClient';

const GET_ALLOCATION_STALE_TIME = 30 * 60 * 1_000;

type UseGetAllocationProps = {
  magna_allocation_id?: string | null;
  enabled: boolean;
};

const useGetAllocationQuery = ({
  magna_allocation_id,
  enabled,
}: UseGetAllocationProps) => {
  return trpc.tokenAllocation.getAllocation.useQuery(
    { magna_allocation_id: magna_allocation_id || '' },
    {
      gcTime: GET_ALLOCATION_STALE_TIME,
      enabled,
    },
  );
};

export default useGetAllocationQuery;
