import AddressInfo from 'models/AddressInfo';
import { useState } from 'react';
import { TokenInfo } from './types';
import { CreateTokenCommunityStep, handleChangeStep } from './utils';

const useCreateCommunity = () => {
  const [createTokenCommunityStep, setCreateTokenCommunityStep] =
    useState<CreateTokenCommunityStep>(
      CreateTokenCommunityStep.CommunityInformation,
    );
  const [selectedAddress, setSelectedAddress] = useState<AddressInfo>(
    new AddressInfo({
      address: '', // add sample address info
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any),
  );
  const [createdTokenInfo, setCreatedTokenInfo] = useState<TokenInfo>({
    // Sample data
    name: 'Tk token',
    symbol: 'TKN',
    description: `Lorem Ipsum is simply dummy text of the printing and typesetting industry.`,
    imageURL:
      'https://img.freepik.com/free-vector/bird-colorful-logo-gradient-vector_343694-1365.jpg',
  });

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
