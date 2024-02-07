import clsx from 'clsx';
import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';

import './FormStep.scss';

export interface FormStepProps {
  index: number;
  label: string;
  state: 'active' | 'inactive' | 'completed';
}

const FormStep = ({ index, label, state }: FormStepProps) => {
  const isCompleted = state === 'completed';

  return (
    <div className={clsx('FormStep', state)}>
      {isCompleted ? (
        <CWIcon iconName="checkCircleFilled" />
      ) : (
        <CWText type="h5" className="index">
          {index}
        </CWText>
      )}
      <CWText type="b2" className="label">
        {label}
      </CWText>
    </div>
  );
};

export default FormStep;
