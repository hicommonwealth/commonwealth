import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Group from 'models/Group';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const GROUPS_STALE_TIME = 5000; // 5 seconds

interface FetchGroupsProps {
  chainId: string;
  shouldIncludeMembers?: boolean;
}

const fetchGroups = async ({
  chainId,
  shouldIncludeMembers = false,
}: FetchGroupsProps): Promise<Group[]> => {
  const response = await axios.get(
    `${app.serverUrl()}${ApiEndpoints.FETCH_GROUPS}`,
    {
      params: {
        chain_id: chainId,
        include_members: shouldIncludeMembers,
      },
    }
  );

  return response.data.result.map((t) => new Group(t));
};

const useFetchGroupsQuery = ({ chainId }: FetchGroupsProps) => {
  return useQuery({
    queryKey: [ApiEndpoints.FETCH_GROUPS, chainId],
    queryFn: () => fetchGroups({ chainId }),
    staleTime: GROUPS_STALE_TIME,
  });
};

export default useFetchGroupsQuery;
