import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Group from 'models/Group';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const GROUPS_STALE_TIME = 5000; // 5 seconds

interface FetchGroupsProps {
  communityId: string;
  includeTopics?: boolean;
  includeMembers?: boolean;
}

const fetchGroups = async ({
  communityId,
  includeMembers = false,
  includeTopics = false,
}: FetchGroupsProps): Promise<Group[]> => {
  const response = await axios.get(
    `${app.serverUrl()}${ApiEndpoints.FETCH_GROUPS}`,
    {
      params: {
        chain_id: communityId,
        include_members: includeMembers,
        include_topics: includeTopics,
      },
    },
  );

  return response.data.result.map((t) => new Group(t));
};

const useFetchGroupsQuery = ({
  communityId,
  includeMembers,
  includeTopics,
}: FetchGroupsProps) => {
  return useQuery({
    queryKey: [
      ApiEndpoints.FETCH_GROUPS,
      communityId,
      includeMembers,
      includeTopics,
    ],
    queryFn: () => fetchGroups({ communityId, includeMembers, includeTopics }),
    staleTime: GROUPS_STALE_TIME,
  });
};

export default useFetchGroupsQuery;
