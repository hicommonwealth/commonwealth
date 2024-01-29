import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Group from 'models/Group';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const GROUPS_STALE_TIME = 5000; // 5 seconds

interface FetchGroupsProps {
  communityId: string;
  includeTopics?: boolean;
  // includeMembers?: boolean;
}

const fetchGroups = async ({
  communityId,
  // includeMembers = false,
  includeTopics = false,
}: FetchGroupsProps): Promise<Group[]> => {
  // HACK:
  // This returns early when communityId is falsy
  // ideal solution would be to make the `enabled` prop of `useQuery`
  // work, but for some reason, it messes up on the /members page.
  // This early return however doesn't seem to messup cache on current page.
  if (!communityId) return;

  const response = await axios.get(
    `${app.serverUrl()}${ApiEndpoints.FETCH_GROUPS}`,
    {
      params: {
        community_id: communityId,
        // include_members: includeMembers,
        ...(includeTopics && { include_topics: includeTopics }),
      },
    },
  );

  return response.data.result.map((t) => new Group(t));
};

const useFetchGroupsQuery = ({
  communityId,
  // includeMembers,
  includeTopics,
  enabled = true,
}: FetchGroupsProps & { enabled?: boolean }) => {
  return useQuery({
    queryKey: [
      ApiEndpoints.FETCH_GROUPS,
      communityId,
      includeTopics,
      // includeMembers,
    ],
    queryFn: () =>
      fetchGroups({
        communityId,
        // includeMembers,
        includeTopics,
      }),
    staleTime: GROUPS_STALE_TIME,
    enabled,
  });
};

export default useFetchGroupsQuery;
