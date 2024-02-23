import React from 'react';

import { ComponentType } from 'views/components/component_kit/types';

import FormStep, { FormStepProps } from './FormStep';

import './CWFormSteps.scss';

export interface CWFormStepsProps {
  steps: Omit<FormStepProps, 'index'>[];
}

const CWFormSteps = ({ steps }: CWFormStepsProps) => {
  if (!steps || steps.length === 0) {
    return;
  }

  return (
    <div className={ComponentType.FormSteps}>
      {steps.map(({ label, state }, index) => (
        <FormStep
          key={`${label}-${state}`}
          index={index + 1}
          label={label}
          state={state}
        />
      ))}
    </div>
  );
};

export default CWFormSteps;
