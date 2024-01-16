import React from 'react';

import ActionStep, { ActionStepProps } from './ActionStep';

import { MessageRow } from 'views/components/component_kit/new_designs/CWTextInput/MessageRow';

import './ActionSteps.scss';

interface ActionStepsProps {
  steps: Array<Omit<ActionStepProps, 'index'> & { errorText?: string }>;
}

const ActionSteps = ({ steps }: ActionStepsProps) => {
  if (!steps || steps.length === 0) {
    return;
  }

  return (
    <div className="ActionSteps">
      {steps.map(({ label, state, actionButton, errorText }, index) => (
        <React.Fragment key={`${label}-${state}`}>
          <ActionStep
            label={label}
            index={index + 1}
            state={state}
            actionButton={actionButton}
          />
          {errorText && (
            <MessageRow
              hasFeedback
              statusMessage={errorText}
              validationStatus="failure"
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ActionSteps;
