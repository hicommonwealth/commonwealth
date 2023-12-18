import React from 'react';

import AddressInfo from 'models/AddressInfo';
import { CWText } from 'views/components/component_kit/cw_text';
import { SelectedCommunity } from 'views/components/component_kit/new_designs/CWCommunitySelector';
import CreateCommunityHint from 'views/pages/CreateCommunity/components/CreateCommunityHint/CreateCommunityHint';
import BasicInformationForm from './BasicInformationForm/BasicInformationForm';

import './BasicInformationStep.scss';

interface BasicInformationStepProps {
  selectedAddress: AddressInfo;
  selectedCommunity: SelectedCommunity;
  handleGoBack: () => void;
  handleContinue: (communityId: string) => void;
}

const BasicInformationStep = ({
  selectedAddress,
  selectedCommunity,
  handleGoBack,
  handleContinue,
}: BasicInformationStepProps) => {
  return (
    <div className="BasicInformationStep">
      <section className="header">
        <CWText type="h2">Tell us about your community</CWText>
        <CWText type="b1" className="description">
          Let’s start with some basic information about your community
        </CWText>
      </section>

      <CreateCommunityHint
        title="Selecting your chain"
        hint="Choose the chain that your Ethereum project is built on.
        If you’re not sure what to choose you can select the Ethereum Mainnet."
      />

      <BasicInformationForm
        selectedAddress={selectedAddress}
        selectedCommunity={selectedCommunity}
        onSubmit={handleContinue}
        onCancel={handleGoBack}
      />
    </div>
  );
};

export default BasicInformationStep;
