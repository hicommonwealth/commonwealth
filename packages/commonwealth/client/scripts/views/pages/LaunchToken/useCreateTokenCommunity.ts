import AddressInfo from 'models/AddressInfo';
import NodeInfo from 'models/NodeInfo';
import { useEffect, useState } from 'react';
import { fetchNodes } from 'state/api/nodes';

const useCreateTokenCommunity = () => {
  const LAUNCHPAD_CHAIN_ID = parseInt(process.env.LAUNCHPAD_CHAIN_ID || '8453');

  const [baseNode, setBaseNode] = useState<NodeInfo | undefined>();
  const [selectedAddress, setSelectedAddress] = useState<AddressInfo>();
  const [createdCommunityId, setCreatedCommunityId] = useState<string>();

  // fetch nodes from cache or API and select the base node
  useEffect(() => {
    fetchNodes()
      .then((nodes) => {
        const found = nodes.find((n) => n.ethChainId === LAUNCHPAD_CHAIN_ID);
        setBaseNode(found as NodeInfo | undefined);
      })
      .catch(console.error);
  }, [LAUNCHPAD_CHAIN_ID]);

  return {
    baseNode,
    selectedAddress,
    setSelectedAddress,
    createdCommunityId,
    setCreatedCommunityId,
  };
};

export default useCreateTokenCommunity;
