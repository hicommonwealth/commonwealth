import React from 'react';

import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';

import { FundContestStep } from '../../FundContestDrawer';

import './FundContestFailure.scss';

interface FundContestFailureProps {
  onSetFundContestDrawerStep: (step: FundContestStep) => void;
}

const FundContestFailure = ({
  onSetFundContestDrawerStep,
}: FundContestFailureProps) => {
  return (
    <div className="FundContestFailure">
      <img
        src="/static/img/contestFundsFailure.png"
        alt="success"
        className="img"
      />
      <CWText type="h4">Something went wrong</CWText>
      <CWText type="b1" className="description">
        We were unable to complete your transaction because of a network error.
        Please try again.
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
