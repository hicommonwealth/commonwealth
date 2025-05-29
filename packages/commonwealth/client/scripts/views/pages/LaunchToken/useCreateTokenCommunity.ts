import AddressInfo from 'models/AddressInfo';
import NodeInfo from 'models/NodeInfo';
import { useEffect, useState } from 'react';
import { fetchCachedNodes, fetchNodes } from 'state/api/nodes';

const useCreateTokenCommunity = () => {
  const LAUNCHPAD_CHAIN_ID = parseInt(process.env.LAUNCHPAD_CHAIN_ID || '8453');

  // get base chain node info from cache first
  const cachedNodes = fetchCachedNodes();
  const cachedBaseNode = cachedNodes?.find(
    (n) => n.ethChainId === LAUNCHPAD_CHAIN_ID,
  ) as NodeInfo | undefined;

  const [baseNode, setBaseNode] = useState<NodeInfo | undefined>(cachedBaseNode);
  const [selectedAddress, setSelectedAddress] = useState<AddressInfo>();
  const [createdCommunityId, setCreatedCommunityId] = useState<string>();

  // if no cached node found, fetch nodes from the API
  useEffect(() => {
    if (!baseNode) {
      fetchNodes()
        .then((nodes) => {
          const found = nodes.find((n) => n.ethChainId === LAUNCHPAD_CHAIN_ID);
          setBaseNode(found as NodeInfo | undefined);
        })
        .catch(console.error);
    }
  }, [baseNode, LAUNCHPAD_CHAIN_ID]);

  return {
    baseNode,
    selectedAddress,
    setSelectedAddress,
    createdCommunityId,
    setCreatedCommunityId,
  };
};

export default useCreateTokenCommunity;
