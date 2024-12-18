import { trpc } from 'client/scripts/utils/trpcClient';

const PROFILE_STALE_TIME = 30 * 1_000; // 3 minutes

type UseFetchProfileByIdQueryCommonProps = {
  userId?: number;
  apiCallEnabled?: boolean;
};

const useFetchProfileByIdQuery = ({
  userId,
  apiCallEnabled = true,
}: UseFetchProfileByIdQueryCommonProps) => {
  return trpc.user.getUserProfile.useQuery(
    {
      userId,
    },
    {
      staleTime: PROFILE_STALE_TIME,
      enabled: apiCallEnabled,
    },
  );
};

export default useFetchProfileByIdQuery;
