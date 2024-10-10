import { useFlag } from 'hooks/useFlag';
import AddressInfo from 'models/AddressInfo';
import { useState } from 'react';
import { chainIdsWithStakeEnabled } from 'views/components/CommunityInformationForm/constants';
import { SelectedCommunity } from 'views/components/component_kit/new_designs/CWCommunitySelector';
import { CreateCommunityStep, handleChangeStep } from './utils';

const useCreateCommunity = () => {
  const [createCommunityStep, setCreateCommunityStep] =
    useState<CreateCommunityStep>(CreateCommunityStep.CommunityTypeSelection);
  const [selectedCommunity, setSelectedCommunity] = useState<SelectedCommunity>(
    // @ts-expect-error StrictNullChecks
    { type: null, chainBase: null },
  );

  const weightedTopicsEnabled = useFlag('weightedTopics');

  // @ts-expect-error StrictNullChecks
  const [selectedAddress, setSelectedAddress] = useState<AddressInfo>(null);
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [createdCommunityId, setCreatedCommunityId] = useState('');
  const [createdCommunityName, setCreatedCommunityName] = useState('');

  const onChangeStep = (forward: boolean) => {
    handleChangeStep(
      forward,
      createCommunityStep,
      setCreateCommunityStep,
      showCommunityStakeStep,
    );
  };

  const handleCompleteCommunityInformationStep = (
    communityId: string,
    communityName: string,
  ) => {
    onChangeStep(true);
    setCreatedCommunityId(communityId);
    setCreatedCommunityName(communityName);
  };

  const isValidStepToShowCommunityStakeFormStep = [
    CreateCommunityStep.CommunityInformation,
    CreateCommunityStep.CommunityStake,
  ].includes(createCommunityStep);

  const isSupportedChainSelected = chainIdsWithStakeEnabled.includes(
    parseInt(selectedChainId || ''),
  );

  const showCommunityStakeStep =
    !weightedTopicsEnabled &&
    isValidStepToShowCommunityStakeFormStep &&
    isSupportedChainSelected;

  return {
    createCommunityStep,
    selectedCommunity,
    setSelectedCommunity,
    selectedAddress,
    setSelectedAddress,
    setSelectedChainId,
    createdCommunityId,
    createdCommunityName,
    handleCompleteCommunityInformationStep,
    onChangeStep,
    showCommunityStakeStep,
    selectedChainId,
  };
};

export default useCreateCommunity;
