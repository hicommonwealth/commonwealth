import axios from 'axios';
import NodeInfo from 'models/NodeInfo';
import { BASE_API_PATH, trpc } from 'utils/trpcClient';
import { queryClient } from '../config';

const NODES_STALE_TIME = 3 * 60 * 1_000; // 3 min
const NODES_CACHE_TIME = Infinity;

// this is a default query that should be used to get list of nodes
const useFetchNodesQuery = () => {
  return trpc.superAdmin.getChainNodes.useQuery(undefined, {
    staleTime: NODES_STALE_TIME,
    cacheTime: NODES_CACHE_TIME,
    select: (data) => data.map((node) => new NodeInfo(node)),
  });
};

export const fetchCachedNodes = (): NodeInfo[] | undefined => {
  const queryKey = trpc.superAdmin.getChainNodes.getQueryKey();
  return queryClient.getQueryData<NodeInfo[]>(queryKey);
};

export const fetchNodes = async (): Promise<NodeInfo[]> => {
  const queryKey = trpc.superAdmin.getChainNodes.getQueryKey();
  const cache = queryClient.getQueryData<NodeInfo[]>(queryKey);
  if (cache) return cache;

  // HACK: with @trpc/react-query v10.x, we can't directly call an endpoint outside of 'react-context'
  // with this way the api can be used in non-react files. This should be cleaned up when we migrate
  // to @trpc/react-query v11.x
  const response = await axios.get(`${BASE_API_PATH}/superAdmin.getChainNodes`);
  const data = response?.data[0]?.result?.data as NodeInfo[];
  // add response in cache
  queryClient.setQueryData(queryKey, data);
  return data;
};

export default useFetchNodesQuery;
