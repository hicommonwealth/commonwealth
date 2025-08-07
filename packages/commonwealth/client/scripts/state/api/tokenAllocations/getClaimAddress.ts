import { trpc } from 'utils/trpcClient';

const GET_CLAIM_ADDRESS_STALE_TIME = 60 * 3_000; // 3 mins

type UseGetClaimAddressProps = {
  enabled?: boolean;
};

const useGetClaimAddressQuery = ({
  enabled = true,
}: UseGetClaimAddressProps) => {
  return trpc.tokenAllocation.getClaimAddress.useQuery(undefined, {
    gcTime: GET_CLAIM_ADDRESS_STALE_TIME,
    enabled,
  });
};

export default useGetClaimAddressQuery;
