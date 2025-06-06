import { getQueryKey } from '@trpc/react-query';
import axios from 'axios';
import NodeInfo, { ChainNode } from 'models/NodeInfo';
import { BASE_API_PATH, trpc } from 'utils/trpcClient';
import { queryClient } from '../config';

const NODES_STALE_TIME = Infinity;
const NODES_CACHE_TIME = Infinity;

// this is a default query that should be used to get list of nodes
const useFetchNodesQuery = () => {
  return trpc.superAdmin.getChainNodes.useQuery(undefined, {
    staleTime: NODES_STALE_TIME,
    gcTime: NODES_CACHE_TIME,
    select: (data) => data.map((node) => new NodeInfo(node as ChainNode)),
  });
};

export const fetchCachedNodes = (): NodeInfo[] | undefined => {
  const queryKey = getQueryKey(trpc.superAdmin.getChainNodes);
  return queryClient.getQueryData<NodeInfo[]>(queryKey);
};

export const fetchNodes = async (): Promise<NodeInfo[]> => {
  const queryKey = getQueryKey(trpc.superAdmin.getChainNodes);
  const cache = queryClient.getQueryData<NodeInfo[]>(queryKey);
  if (cache) return cache;

  // HACK: with @trpc/react-query v10.x, we can't directly call an endpoint outside of 'react-context'
  // with this way the api can be used in non-react files. This should be cleaned up when we migrate
  // to @trpc/react-query v11.x
  const { data } = await axios.get(`${BASE_API_PATH}/superAdmin.getChainNodes`);
  const nodes = (data?.result?.data || []).map(
    (node: ChainNode) => new NodeInfo(node),
  );

  // add response in cache
  nodes && queryClient.setQueryData(queryKey, nodes);
  return nodes;
};

export default useFetchNodesQuery;
