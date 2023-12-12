import AddressInfo from 'models/AddressInfo';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { SelectedCommunity } from 'views/components/component_kit/new_designs/CWCommunitySelector';
import { openConfirmation } from 'views/modals/confirmation_modal';
import CreateCommunityHint from 'views/pages/CreateCommunity/components/CreateCommunityHint/CreateCommunityHint';
import BasicInformationForm from './BasicInformationForm/BasicInformationForm';
import './BasicInformationStep.scss';

interface BasicInformationStepProps {
  selectedAddress: AddressInfo;
  selectedCommunity: SelectedCommunity;
  handleGoBack: () => void;
  handleContinue: () => void;
}

const BasicInformationStep = ({
  selectedAddress,
  selectedCommunity,
  handleGoBack,
  handleContinue,
}: BasicInformationStepProps) => {
  console.log('selectedAddress', selectedAddress);
  console.log('selectedCommunity', selectedCommunity);
  const handleClickCancel = () => {
    // todo open confirmation modal only when some input form is filled out

    openConfirmation({
      title: 'Are you sure you want to cancel?',
      description: 'Your details will not be saved. Cancel create community?',
      buttons: [
        {
          label: 'Yes, cancel',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: handleGoBack,
        },
        {
          label: 'No, continue',
          buttonType: 'primary',
          buttonHeight: 'sm',
        },
      ],
    });
  };

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
        chainEcosystem="ethereum" // TODO: this has to come from step 1 when user selects the community ecosystem
        onSubmit={(values) => {
          console.log('submitted values => ', values);
          handleContinue();
        }} // TODO: connect api from the onSubmit
        onCancel={handleClickCancel} // TODO: connect when step 1 is done
      />
    </div>
  );
};

export default BasicInformationStep;
