import { trpc } from 'utils/trpcClient';

const ADMINS_STALE_TIME = 30 * 1_000; // 30 s

interface FetchAdminProps {
  communityId: string;
  apiEnabled?: boolean;
}

const useFetchAdminQuery = ({
  communityId,
  apiEnabled = true,
}: FetchAdminProps) => {
  return trpc.community.getRoles.useQuery(
    {
      community_id: communityId,
      roles: 'admin,moderator',
    },
    {
      staleTime: ADMINS_STALE_TIME,
      enabled: apiEnabled,
    },
  );
};

export default useFetchAdminQuery;
