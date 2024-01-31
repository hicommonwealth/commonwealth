import { useFlag } from '@unleash/proxy-client-react';
import { useState } from 'react';

import { ValidChains } from '@hicommonwealth/chains';
import AddressInfo from 'models/AddressInfo';
import { SelectedCommunity } from 'views/components/component_kit/new_designs/CWCommunitySelector';

import { CreateCommunityStep, handleChangeStep } from './utils';

const useCreateCommunity = () => {
  const communityStakeEnabled = useFlag('flag.communityStake');
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
  // TODO only for testing/QA purpose
  // Goerli should be removed before merging to production
  // only ETHEREUM_MAINNET_ID should be here
  const isEthereumMainnetSelected =
    // selectedChainId === ETHEREUM_MAINNET_ID ||
    selectedChainId === String(ValidChains.Goerli);
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
  };
};

export default useCreateCommunity;
