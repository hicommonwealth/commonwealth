import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import NodeInfo from 'models/NodeInfo';
import { ApiEndpoints, SERVER_URL, queryClient } from 'state/api/config';

const NODES_STALE_TIME = 3 * 60 * 1_000; // 3 min
const NODES_CACHE_TIME = Infinity;

const fetchNodes = async (): Promise<NodeInfo[]> => {
  const response = await axios.get(`${SERVER_URL}/${ApiEndpoints.FETCH_NODES}`);

  return response.data.result.map(NodeInfo.fromJSON);
};

// this is specifically used where you want to get nodes synchronously (only directly from cache)
export const fetchCachedNodes = () => {
  return queryClient.getQueryData<NodeInfo[]>([ApiEndpoints.FETCH_NODES]);
};

// this is similar to hook below, but for non-react files, where the hooks cannot be used
export const fetchNodesQuery = async () => {
  return await queryClient.fetchQuery({
    queryKey: [ApiEndpoints.FETCH_NODES],
    queryFn: fetchNodes,
    staleTime: NODES_STALE_TIME,
    cacheTime: NODES_CACHE_TIME,
  });
};

// this is a default query that should be used to get list of nodes
const useFetchNodesQuery = () => {
  return useQuery({
    queryKey: [ApiEndpoints.FETCH_NODES],
    queryFn: fetchNodes,
    staleTime: NODES_STALE_TIME,
    cacheTime: NODES_CACHE_TIME,
  });
};

export default useFetchNodesQuery;
