import React from 'react';

import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';

import ActionSteps from '../../../components/ActionSteps';
import Hint from '../../../components/Hint';

import './SignStakeTransactions.scss';

interface SignStakeTransactionsProps {
  onOptOutEnablingStake: () => void;
}
const SignStakeTransactions = ({
  onOptOutEnablingStake,
}: SignStakeTransactionsProps) => {
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

        <Hint className="mobile" />

        <CWText fontWeight="medium" type="b1" className="description">
          Do not close the window or navigate away until the transactions are
          complete.
        </CWText>

        <ActionSteps
          steps={[
            {
              state: 'completed',
              label: 'Reserve community namespace',
              actionButton: {
                label: 'Signed',
                disabled: true,
                onClick: () => console.log('disabled'),
              },
            },
            {
              state: 'loading',
              label: 'Launch community stake',
            },
            {
              state: 'not-started',
              label: 'Something else',
              actionButton: {
                label: 'Sign',
                disabled: false,
                onClick: () => console.log('click'),
              },
            },
          ]}
        />

        <CWDivider />

        <section className="action-buttons">
          <CWButton
            type="button"
            label="Cancel"
            buttonWidth="wide"
            buttonType="secondary"
            onClick={onOptOutEnablingStake}
          />
        </section>
      </section>

      <Hint className="desktop" />
    </div>
  );
};

export default SignStakeTransactions;
