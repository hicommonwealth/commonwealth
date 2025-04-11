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
      showOnchainTransactionsStep,
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
    CreateCommunityStep.OnchainTransactions,
  ].includes(createCommunityStep);

  const isSupportedChainSelected = chainIdsWithStakeEnabled.some(
    (chainId) => chainId === parseInt(selectedChainId || ''),
  );

  const showOnchainTransactionsStep =
    isValidStepToShowCommunityStakeFormStep && isSupportedChainSelected;

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
    showOnchainTransactionsStep,
    selectedChainId,
  };
};

export default useCreateCommunity;
