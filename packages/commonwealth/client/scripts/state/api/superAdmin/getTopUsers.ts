import { trpc } from 'utils/trpcClient';

const TOP_USERS_STALE_TIME = 6 * 60 * 60 * 1000;

const useGetTopUsersQuery = (enabled = false) => {
  return trpc.superAdmin.getTopUsers.useQuery(
    {},
    {
      staleTime: TOP_USERS_STALE_TIME,
      enabled,
    },
  );
};

export default useGetTopUsersQuery;
