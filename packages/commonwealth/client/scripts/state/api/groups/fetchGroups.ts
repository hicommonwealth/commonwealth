import Group from 'client/scripts/models/Group';
import { trpc } from 'utils/trpcClient';

const GROUPS_STALE_TIME = 5000; // 5 seconds

type FetchGroupsProps = {
  includeTopics?: boolean;
} & (
  | {
      communityId: string;
      groupId?: never;
    }
  | {
      communityId?: never;
      groupId: string;
    }
);

const useFetchGroupsQuery = ({
  communityId,
  groupId,
  includeTopics,
  enabled = true,
}: FetchGroupsProps & { enabled?: boolean }) => {
  return trpc.community.getGroups.useQuery(
    {
      community_id: communityId,
      group_id: groupId ? +groupId : undefined,
      include_topics: includeTopics,
    },
    {
      staleTime: GROUPS_STALE_TIME,
      enabled,
      select: (data) => {
        return data.map((g) => new Group(g));
      },
    },
  );
};

export default useFetchGroupsQuery;
