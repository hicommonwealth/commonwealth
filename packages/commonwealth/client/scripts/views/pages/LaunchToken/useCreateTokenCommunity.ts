import { commonProtocol } from '@hicommonwealth/evm-protocols';
import AddressInfo from 'models/AddressInfo';
import NodeInfo from 'models/NodeInfo';
import { useState } from 'react';
import { fetchCachedNodes } from 'state/api/nodes';

const useCreateTokenCommunity = () => {
  // get base chain node info
  const nodes = fetchCachedNodes();
  const baseNode = nodes?.find(
    (n) => n.ethChainId === commonProtocol.ValidChains.SepoliaBase,
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
