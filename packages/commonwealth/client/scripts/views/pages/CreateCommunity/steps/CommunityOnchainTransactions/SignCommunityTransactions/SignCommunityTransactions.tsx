import React from 'react';

import useBeforeUnload from 'hooks/useBeforeUnload';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import ActionSteps from 'views/pages/CreateCommunity/components/ActionSteps';
import Hint from 'views/pages/CreateCommunity/components/Hint';

import { TransactionConfig } from '../types';

import './SignCommunityTransactions.scss';

export interface SignCommunityTransactionsProps {
  title: string;
  description: string;
  transactions: TransactionConfig[];
  isPreventLeaveEnabled?: boolean;
  backButton?: {
    label: string;
    action: () => void;
  };
}

const SignCommunityTransactions = ({
  title,
  description,
  transactions,
  isPreventLeaveEnabled = true,
  backButton,
}: SignCommunityTransactionsProps) => {
  useBeforeUnload(isPreventLeaveEnabled);

  const cancelDisabled = transactions.some(
    (transaction) => transaction.state === 'loading',
  );

  return (
    <div className="SignCommunityTransactions">
      <div className="header">
        <CWText type="h2">{title}</CWText>
        <CWText type="b1" className="description">
          {description}
        </CWText>

        <Hint className="mobile" />

        <CWText fontWeight="medium" type="b1" className="description">
          Do not close the window or navigate away until the transactions are
          complete.
        </CWText>

        <ActionSteps
          steps={transactions.map((transaction) => ({
            label: transaction.label,
            description: transaction.description,
            state: transaction.state,
            errorText: transaction.errorText,
            ...(transaction.shouldShowActionButton
              ? {
                  actionButton: {
                    label:
                      transaction.state === 'completed' ? 'Signed' : 'Sign',
                    disabled:
                      transaction.isActionButtonDisabled !== undefined
                        ? transaction.isActionButtonDisabled
                        : transaction.state === 'loading' ||
                          transaction.state === 'completed',
                    onClick: transaction.action,
                  },
                }
              : {}),
          }))}
        />

        <CWDivider />

        <section className="action-buttons">
          <CWButton
            type="button"
            label={backButton?.label}
            buttonWidth="wide"
            buttonType="secondary"
            disabled={cancelDisabled}
            onClick={backButton?.action}
          />
        </section>
      </div>

      <Hint className="desktop" />
    </div>
  );
};

export default SignCommunityTransactions;
