import AddressInfo from 'models/AddressInfo';
import NodeInfo from 'models/NodeInfo';
import { useState } from 'react';
import { fetchCachedNodes } from 'state/api/nodes';

const useCreateTokenCommunity = () => {
  // get base chain node info
  const nodes = fetchCachedNodes();
  const baseNode = nodes?.find(
    (n) => n.ethChainId === parseInt(process.env.LAUNCHPAD_CHAIN_ID || '8453'),
  ) as NodeInfo; // this is expected to exist

  const [selectedAddress, setSelectedAddress] = useState<AddressInfo>();
  const [createdCommunityId, setCreatedCommunityId] = useState<string>();

  return {
    baseNode,
    selectedAddress,
    setSelectedAddress,
    createdCommunityId,
    setCreatedCommunityId,
  };
};

export default useCreateTokenCommunity;
