import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';

import './OnchainVerification.scss';

const OnchainVerification = () => {
  const navigate = useCommonNavigate();

  return (
    <section className="OnchainVerification">
      <div className="header">
        <div className="flex-row">
          <CWText type="h4">Onchain Verification</CWText>
        </div>
        <CWText type="b1">
          Onchain verification is a process that allows you to verify your
          community onchain by minting a verification token.
        </CWText>
      </div>
      <CWButton
        buttonType="secondary"
        label="Manage Onchain Verification"
        onClick={() => navigate('/manage/integrations/onchain-verification')}
      />
    </section>
  );
};

export default OnchainVerification;
