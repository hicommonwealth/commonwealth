import { commonProtocol } from '@hicommonwealth/core';
import AddressInfo from 'models/AddressInfo';
import { useState } from 'react';
import { SelectedCommunity } from 'views/components/component_kit/new_designs/CWCommunitySelector';
import { useFlag } from '../../../hooks/useFlag';
import { CreateCommunityStep, handleChangeStep } from './utils';

const useCreateCommunity = () => {
  const communityStakeEnabled = useFlag('communityStake');
  const [createCommunityStep, setCreateCommunityStep] =
    useState<CreateCommunityStep>(CreateCommunityStep.CommunityTypeSelection);
  const [selectedCommunity, setSelectedCommunity] = useState<SelectedCommunity>(
    { type: null, chainBase: null },
  );
  const [selectedAddress, setSelectedAddress] = useState<AddressInfo>(null);
  const [selectedChainId, setSelectedChainId] = useState(null);
  const [createdCommunityId, setCreatedCommunityId] = useState('');
  const [createdCommunityName, setCreatedCommunityName] = useState('');

  const onChangeStep = (forward: boolean) => {
    handleChangeStep(
      forward,
      createCommunityStep,
      setCreateCommunityStep,
      showCommunityStakeStep,
      communityStakeEnabled,
    );
  };

  const handleCompleteBasicInformationStep = (
    communityId: string,
    communityName: string,
  ) => {
    onChangeStep(true);
    setCreatedCommunityId(communityId);
    setCreatedCommunityName(communityName);
  };

  const isValidStepToShowCommunityStakeFormStep = [
    CreateCommunityStep.BasicInformation,
    CreateCommunityStep.CommunityStake,
  ].includes(createCommunityStep);
  const isEthereumMainnetSelected =
    // selectedChainId === ETHEREUM_MAINNET_ID ||
    Object.values(commonProtocol.ValidChains).includes(
      parseInt(selectedChainId),
    );
  const showCommunityStakeStep =
    isValidStepToShowCommunityStakeFormStep &&
    selectedCommunity.type === 'ethereum' &&
    isEthereumMainnetSelected;

  return {
    createCommunityStep,
    selectedCommunity,
    setSelectedCommunity,
    selectedAddress,
    setSelectedAddress,
    setSelectedChainId,
    createdCommunityId,
    createdCommunityName,
    handleCompleteBasicInformationStep,
    onChangeStep,
    showCommunityStakeStep,
    selectedChainId,
  };
};

export default useCreateCommunity;
