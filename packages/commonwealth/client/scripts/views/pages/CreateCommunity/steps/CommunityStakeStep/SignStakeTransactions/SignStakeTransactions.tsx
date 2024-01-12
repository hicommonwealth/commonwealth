import React from 'react';

import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import CreateCommunityHint from '../../../components/CreateCommunityHint';

import './SignStakeTransactions.scss';

const SignStakeTransactions = () => {
  const handleCancel = () => {
    console.log('cancel');
  };

  const renderHint = (className: string) => (
    <CreateCommunityHint
      className={className}
      title="What is a namespace?"
      hint="The namespace is an address that represents your community  on-chain.
          You can purchase additional community namespaces from the admin panel."
    />
  );

  return (
    <div className="SignStakeTransactions">
      <section className="header">
        <CWText type="h2">Sign transactions to launch stakes?</CWText>
        <CWText type="b1" className="description">
          In order to launch community stakes you will need to sign two
          transactions. The first launches your community namespace on the
          blockchain, and the second launches your community stakes. Both
          transactions have associated gas fees.
        </CWText>

        {renderHint('mobile')}

        <CWText fontWeight="medium" type="b1" className="description">
          Do not close the window or navigate away until the transactions are
          complete.
        </CWText>

        <CWDivider />

        <section className="action-buttons">
          <CWButton
            type="button"
            label="Cancel"
            buttonWidth="wide"
            buttonType="secondary"
            onClick={handleCancel}
          />
        </section>
      </section>

      {renderHint('desktop')}
    </div>
  );
};

export default SignStakeTransactions;
