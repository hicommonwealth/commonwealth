import { trpc } from 'utils/trpcClient';

const GET_CLAIM_ADDRESS_STALE_TIME = 30 * 60 * 1_000;

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
