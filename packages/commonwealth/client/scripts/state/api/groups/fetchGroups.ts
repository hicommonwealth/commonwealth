import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Group from 'models/Group';
import { ApiEndpoints, SERVER_URL } from 'state/api/config';

const GROUPS_STALE_TIME = 5000; // 5 seconds

type FetchGroupsProps = {
  includeTopics?: boolean;
  // includeMembers?: boolean;
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

const fetchGroups = async ({
  communityId,
  groupId,
  // includeMembers = false,
  includeTopics = false,
}: FetchGroupsProps): Promise<Group[]> => {
  // HACK:
  // This returns early when communityId is falsy
  // ideal solution would be to make the `enabled` prop of `useQuery`
  // work, but for some reason, it messes up on the /members page.
  // This early return however doesn't seem to messup cache on current page.
  // @ts-expect-error StrictNullChecks
  if (!communityId && !groupId) return;

  const response = await axios.get(
    `${SERVER_URL}${ApiEndpoints.FETCH_GROUPS}`,
    {
      params: {
        community_id: communityId,
        group_id: groupId,
        // include_members: includeMembers,
        ...(includeTopics && { include_topics: includeTopics }),
      },
    },
  );

  return response.data.result.map((t) => new Group(t));
};

const useFetchGroupsQuery = ({
  communityId,
  groupId,
  // includeMembers,
  includeTopics,
  enabled = true,
}: FetchGroupsProps & { enabled?: boolean }) => {
  return useQuery({
    queryKey: [
      ApiEndpoints.FETCH_GROUPS,
      communityId,
      groupId,
      includeTopics,
      // includeMembers,
    ],
    queryFn: () =>
      fetchGroups({
        communityId,
        groupId,
        // includeMembers,
        includeTopics,
      } as FetchGroupsProps),
    staleTime: GROUPS_STALE_TIME,
    enabled,
  });
};

export default useFetchGroupsQuery;
