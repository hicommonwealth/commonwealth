import { getQueryKey } from '@trpc/react-query';
import NodeInfo, { ChainNode } from 'models/NodeInfo';
import { trpc, trpcQueryUtils } from 'utils/trpcClient';
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

// use this to fetch cached nodes synchronously
export const fetchCachedNodes = (): NodeInfo[] | undefined => {
  const queryKey = getQueryKey(trpc.superAdmin.getChainNodes);
  return queryClient.getQueryData<NodeInfo[]>(queryKey);
};

// use this to fetch nodes in non-react components
export const fetchNodes = async (): Promise<NodeInfo[]> => {
  const queryKey = getQueryKey(trpc.superAdmin.getChainNodes);
  const cache = queryClient.getQueryData<NodeInfo[]>(queryKey);
  if (cache) return cache;

  const data = await trpcQueryUtils.superAdmin.getChainNodes.fetch(undefined, {
    staleTime: NODES_STALE_TIME,
    gcTime: NODES_CACHE_TIME,
  });

  const nodes = data.map((node: ChainNode) => new NodeInfo(node));

  // add response in cache
  nodes && queryClient.setQueryData(queryKey, nodes);
  return nodes;
};

export default useFetchNodesQuery;
