import { trpc } from 'utils/trpcClient';

const GET_ALLOCATION_STALE_TIME = 60 * 3_000; // 3 mins

type UseGetAllocationProps = {
  magna_allocation_id?: string | null;
};

const useGetAllocationQuery = ({
  magna_allocation_id,
}: UseGetAllocationProps) => {
  return trpc.tokenAllocation.getAllocation.useQuery(
    { magna_allocation_id: magna_allocation_id || '' },
    {
      gcTime: GET_ALLOCATION_STALE_TIME,
      enabled: !!magna_allocation_id,
    },
  );
};

export default useGetAllocationQuery;
