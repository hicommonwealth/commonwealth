import AddressInfo from 'models/AddressInfo';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import TokenInformationForm from './TokenInformationForm/TokenInformationForm';
import { FormSubmitValues } from './TokenInformationForm/types';
import './TokenInformationStep.scss';

interface TokenInformationStepProps {
  handleGoBack: () => void;
  handleContinue: (values: FormSubmitValues) => void;
  selectedAddress?: AddressInfo;
  onAddressSelected: (address: AddressInfo) => void;
}

const TokenInformationStep = ({
  handleGoBack,
  handleContinue,
  selectedAddress,
  onAddressSelected,
}: TokenInformationStepProps) => {
  return (
    <div className="TokenInformationStep">
      <section className="header">
        <CWText type="h2">Launch Token</CWText>
        <CWText type="b1" className="description">
          Something about launching a token
        </CWText>
      </section>

      <TokenInformationForm
        onSubmit={handleContinue}
        onCancel={handleGoBack}
        selectedAddress={selectedAddress}
        onAddressSelected={onAddressSelected}
      />
    </div>
  );
};

export default TokenInformationStep;
