import { trpc } from 'utils/trpcClient';

const REFERRALS_STALE_TIME = 5 * 60 * 1_000; // 5 minutes

type UseGetUserReferralsQueryProps = {
  userId: number;
  apiCallEnabled?: boolean;
};

const useGetUserReferralsQuery = ({
  userId,
  apiCallEnabled = true,
}: UseGetUserReferralsQueryProps) => {
  return trpc.user.getUserReferrals.useQuery(
    {
      user_id: userId,
    },
    {
      staleTime: REFERRALS_STALE_TIME,
      enabled: apiCallEnabled,
    },
  );
};

export default useGetUserReferralsQuery;
