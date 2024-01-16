import React from 'react';

import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import CWCircleSpinner from 'views/components/component_kit/new_designs/CWCircleSpinner';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';

import './ActionStep.scss';

export interface ActionStepProps {
  state: 'not-started' | 'completed' | 'loading';
  label: string;
  index: number;
  actionButton?: {
    label: string;
    disabled: boolean;
    onClick: () => void;
  };
}

const ActionStep = ({ state, index, label, actionButton }: ActionStepProps) => {
  const isCompleted = state === 'completed';
  const isLoading = state === 'loading';

  return (
    <div className="ActionStep">
      <div className="icon">
        {isCompleted ? (
          <CWIcon
            className="circle-check"
            iconName="checkCircleFilled"
            iconSize="large"
          />
        ) : isLoading ? (
          <CWCircleSpinner />
        ) : (
          <CWText type="h5" className="index">
            {index}
          </CWText>
        )}
      </div>

      <CWText type="h5" className="label">
        {label}
      </CWText>

      {actionButton && (
        <div className="action-btn">
          <CWButton
            buttonHeight="sm"
            disabled={actionButton?.disabled}
            label={actionButton?.label}
            onClick={actionButton?.onClick}
          />
        </div>
      )}
    </div>
  );
};

export default ActionStep;
