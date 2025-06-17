import React from 'react';

import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';

import { FundContestStep } from '../../FundContestDrawer';

import contestFundFailure from 'assets/img/contestFundsFailure.png';
import './FundContestFailure.scss';

interface FundContestFailureProps {
  onSetFundContestDrawerStep: (step: FundContestStep) => void;
  errorMessage?: string;
}

const FundContestFailure = ({
  onSetFundContestDrawerStep,
  errorMessage,
}: FundContestFailureProps) => {
  return (
    <div className="FundContestFailure">
      <img src={contestFundFailure} alt="failure" className="img" />
      <CWText type="h4">Something went wrong</CWText>
      <CWText type="b1" className="description">
        {errorMessage ||
          'We were unable to complete your transaction because of a network error. Please try again.'}
      </CWText>
      <CWButton
        label="Try again"
        buttonWidth="full"
        onClick={() => onSetFundContestDrawerStep('Form')}
      />
    </div>
  );
};

export default FundContestFailure;
