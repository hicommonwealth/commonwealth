import { trpc } from 'utils/trpcClient';

export type GetRolesProps = {
  community_id: string;
  roles: ('moderator' | 'admin')[];
  apiEnabled?: boolean;
};

export const useGetRolesQuery = ({
  community_id,
  roles,
  apiEnabled = true,
}: GetRolesProps) => {
  return trpc.community.getRoles.useQuery(
    { community_id, roles: roles.join(',') },
    { enabled: apiEnabled },
  );
};
