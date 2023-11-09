import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Group from 'models/Group';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const GROUPS_STALE_TIME = 5000; // 5 seconds

interface FetchGroupsProps {
  chainId: string;
  includeTopics?: boolean;
  includeMembers?: boolean;
}

const fetchGroups = async ({
  chainId,
  includeMembers = false,
  includeTopics = false,
}: FetchGroupsProps): Promise<Group[]> => {
  const response = await axios.get(
    `${app.serverUrl()}${ApiEndpoints.FETCH_GROUPS}`,
    {
      params: {
        community_id: chainId,
        include_members: includeMembers,
        include_topics: includeTopics,
      },
    },
  );

  return response.data.result.map((t) => new Group(t));
};

const useFetchGroupsQuery = ({
  chainId,
  includeMembers,
  includeTopics,
  enabled = true,
}: FetchGroupsProps & { enabled?: boolean }) => {
  return useQuery({
    queryKey: [
      ApiEndpoints.FETCH_GROUPS,
      chainId,
      includeMembers,
      includeTopics,
    ],
    queryFn: () => fetchGroups({ chainId, includeMembers, includeTopics }),
    staleTime: GROUPS_STALE_TIME,
    enabled,
  });
};

export default useFetchGroupsQuery;
