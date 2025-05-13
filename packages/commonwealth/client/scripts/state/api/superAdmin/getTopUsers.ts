import { trpc } from 'utils/trpcClient';

const TOP_USERS_STALE_TIME = 60 * 60 * 1000;

const useGetTopUsersQuery = () => {
  return trpc.superAdmin.getTopUsers.useQuery(
    {},
    {
      staleTime: TOP_USERS_STALE_TIME,
      enabled: true,
    },
  );
};

export default useGetTopUsersQuery;
