import React from 'react';

import AddressInfo from 'models/AddressInfo';
import FeatureHint from 'views/components/FeatureHint';
import { CWText } from 'views/components/component_kit/cw_text';
import { SelectedCommunity } from 'views/components/component_kit/new_designs/CWCommunitySelector';
import CommunityInformationForm from './CommunityInformationForm/CommunityInformationForm';

import './CommunityInformationStep.scss';

interface CommunityInformationStepProps {
  selectedAddress: AddressInfo;
  selectedCommunity: SelectedCommunity;
  handleGoBack: () => void;
  handleContinue: (communityId: string, communityName: string) => void;
  handleSelectedChainId: (chainId: string) => void;
}

const CommunityInformationStep = ({
  selectedAddress,
  selectedCommunity,
  handleGoBack,
  handleContinue,
  handleSelectedChainId,
}: CommunityInformationStepProps) => {
  return (
    <div className="CommunityInformationStep">
      <section className="header">
        <CWText type="h2">Tell us about your community</CWText>
        <CWText type="b1" className="description">
          Let’s start with some Community information about your community
        </CWText>
      </section>

      <FeatureHint
        title="Selecting your chain"
        hint="Choose the chain that your Ethereum project is built on.
        If you’re not sure what to choose you can select the Ethereum Mainnet."
      />

      <CommunityInformationForm
        selectedAddress={selectedAddress}
        selectedCommunity={selectedCommunity}
        onSubmit={handleContinue}
        onCancel={handleGoBack}
        handleSelectedChainId={handleSelectedChainId}
      />
    </div>
  );
};

export default CommunityInformationStep;
