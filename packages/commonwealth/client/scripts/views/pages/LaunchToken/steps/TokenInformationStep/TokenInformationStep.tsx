import React from 'react';

import { CWText } from 'views/components/component_kit/cw_text';
import TokenInformationForm from './TokenInformationForm/TokenInformationForm';

import './TokenInformationStep.scss';

interface TokenInformationStepProps {
  handleGoBack: () => void;
  handleContinue: () => void;
}

const TokenInformationStep = ({
  handleGoBack,
  handleContinue,
}: TokenInformationStepProps) => {
  return (
    <div className="TokenInformationStep">
      <section className="header">
        <CWText type="h2">Launch Token</CWText>
        <CWText type="b1" className="description">
          Something about launching a token
        </CWText>
      </section>

      <TokenInformationForm onSubmit={handleContinue} onCancel={handleGoBack} />
    </div>
  );
};

export default TokenInformationStep;
