import { trpc } from 'utils/trpcClient';

const REFERRAL_FEES_STALE_TIME = 5 * 60 * 1_000; // 5 minutes

type UseGetUserReferralFeesQueryProps = {
  distributedTokenAddress?: string;
  userId: number;
  apiCallEnabled?: boolean;
};

const useGetUserReferralFeesQuery = ({
  distributedTokenAddress,
  userId,
  apiCallEnabled = true,
}: UseGetUserReferralFeesQueryProps) => {
  return trpc.user.getUserReferralFees.useQuery(
    {
      distributed_token_address: distributedTokenAddress,
      user_id: userId,
    },
    {
      staleTime: REFERRAL_FEES_STALE_TIME,
      enabled: apiCallEnabled,
    },
  );
};

export default useGetUserReferralFeesQuery;
