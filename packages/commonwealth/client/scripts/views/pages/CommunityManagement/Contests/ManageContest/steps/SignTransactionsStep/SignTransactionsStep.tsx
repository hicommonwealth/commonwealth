import React from 'react';

import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';

import { LaunchContestStep } from '../../ManageContest';

import './SignTransactionsStep.scss';

interface SignTransactionsStepProps {
  onSetLaunchContestStep: (step: LaunchContestStep) => void;
}

const SignTransactionsStep = ({
  onSetLaunchContestStep,
}: SignTransactionsStepProps) => {
  return (
    <CWPageLayout>
      <div className="SignTransactionsStep">
        sign transactions
        <CWButton
          label="Back"
          buttonType="secondary"
          onClick={() => onSetLaunchContestStep('DetailsForm')}
        />
        <CWButton
          label="Next"
          onClick={() => onSetLaunchContestStep('ContestLive')}
        />
      </div>
    </CWPageLayout>
  );
};

export default SignTransactionsStep;
