import { commonProtocol } from '@hicommonwealth/shared';
import AddressInfo from 'models/AddressInfo';
import NodeInfo from 'models/NodeInfo';
import { useState } from 'react';
import { fetchCachedNodes } from 'state/api/nodes';
import { TokenInfo } from './types';
import { CreateTokenCommunityStep, handleChangeStep } from './utils';

const useCreateTokenCommunity = () => {
  // get base chain node info
  const nodes = fetchCachedNodes();
  const baseNode = nodes?.find(
    (n) => n.ethChainId === commonProtocol.ValidChains.SepoliaBase,
  ) as NodeInfo; // this is expected to exist

  const [createTokenCommunityStep, setCreateTokenCommunityStep] =
    useState<CreateTokenCommunityStep>(
      CreateTokenCommunityStep.TokenInformation,
    );
  const [selectedAddress, setSelectedAddress] = useState<AddressInfo>();
  const [draftTokenInfo, setDraftTokenInfo] = useState<TokenInfo>();
  const [createdCommunityId, setCreatedCommunityId] = useState<string>();
  const [isTokenLaunched, setIsTokenLaunched] = useState(false);

  const onChangeStep = (forward: boolean) => {
    handleChangeStep(
      forward,
      createTokenCommunityStep,
      setCreateTokenCommunityStep,
    );
  };

  return {
    baseNode,
    createTokenCommunityStep,
    onChangeStep,
    selectedAddress,
    setSelectedAddress,
    draftTokenInfo,
    setDraftTokenInfo,
    createdCommunityId,
    setCreatedCommunityId,
    isTokenLaunched,
    setIsTokenLaunched,
  };
};

export default useCreateTokenCommunity;
