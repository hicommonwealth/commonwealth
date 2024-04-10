import React from 'react';

import { useCommonNavigate } from 'navigation/helpers';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';

import { LaunchContestStep } from '../../ManageContest';

import './DetailsFormStep.scss';

interface DetailsFormStepProps {
  contestId?: string;
  onSetLaunchContestStep: (step: LaunchContestStep) => void;
}

const DetailsFormStep = ({
  contestId,
  onSetLaunchContestStep,
}: DetailsFormStepProps) => {
  const navigate = useCommonNavigate();

  const editMode = !!contestId;

  const goBack = () => {
    // TODO distinct if user came from /manage/contests or /contests
    navigate('/manage/contests');
  };

  const handleCancel = () => {
    goBack();
  };

  const handleSave = () => {
    if (editMode) {
      // save edit API call
      return goBack();
    }

    onSetLaunchContestStep('SignTransactions');
  };

  return (
    <div className="DetailsFormStep">
      {editMode ? `edit contest id: ${contestId}` : 'create contest'}

      <CWButton label="Cancel" buttonType="secondary" onClick={handleCancel} />
      <CWButton
        label={editMode ? 'Save changes' : 'Save & continue'}
        onClick={handleSave}
      />
    </div>
  );
};

export default DetailsFormStep;
