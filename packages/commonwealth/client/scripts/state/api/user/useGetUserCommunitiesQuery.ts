import { trpc } from 'utils/trpcClient';

interface UseGetUserCommunitiesQueryProps {
  userId: number;
  enabled?: boolean;
}

export const useGetUserCommunitiesQuery = ({
  userId,
  enabled = true,
}: UseGetUserCommunitiesQueryProps) => {
  return trpc.user.getUserCommunities.useQuery(
    { userId },
    { enabled: enabled && !!userId }
  );
};
