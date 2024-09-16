import AddressInfo from 'models/AddressInfo';
import { useState } from 'react';
import { TokenInfo } from './types';
import { CreateTokenCommunityStep, handleChangeStep } from './utils';

const useCreateCommunity = () => {
  const [createTokenCommunityStep, setCreateTokenCommunityStep] =
    useState<CreateTokenCommunityStep>(
      CreateTokenCommunityStep.TokenInformation,
    );
  const [selectedAddress, setSelectedAddress] = useState<AddressInfo>();
  const [createdTokenInfo, setCreatedTokenInfo] = useState<TokenInfo>();

  const onChangeStep = (forward: boolean) => {
    handleChangeStep(
      forward,
      createTokenCommunityStep,
      setCreateTokenCommunityStep,
    );
  };

  return {
    createTokenCommunityStep,
    onChangeStep,
    selectedAddress,
    setSelectedAddress,
    createdTokenInfo,
    setCreatedTokenInfo,
  };
};

export default useCreateCommunity;
