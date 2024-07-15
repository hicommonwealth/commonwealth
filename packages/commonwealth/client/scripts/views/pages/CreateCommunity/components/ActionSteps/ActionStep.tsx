import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleRingSpinner from 'views/components/component_kit/new_designs/CWCircleRingSpinner';
import './ActionStep.scss';
import { ActionStepProps } from './types';

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
          <CWCircleRingSpinner />
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
