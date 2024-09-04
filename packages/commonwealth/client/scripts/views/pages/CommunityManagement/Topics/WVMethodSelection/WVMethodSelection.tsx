import React from 'react';

import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';

import { CreateTopicStep } from '../utils';

import './WVMethodSelection.scss';

interface WVMethodSelectionProps {
  onStepChange: (step: CreateTopicStep) => void;
}

const WVMethodSelection = ({ onStepChange }: WVMethodSelectionProps) => {
  return (
    <div className="WVMethodSelection">
      <section className="header">
        <CWText type="h2">Weighted voting</CWText>
        <CWText type="b1" className="description">
          Activate weighted voting to allow members to cast votes proportional
          to their stake or contribution, ensuring decisions reflect the
          community&apos;s investment levels.
        </CWText>

        <CWText type="h4">Choose weight voting method</CWText>

        <CWDivider />

        <section className="action-buttons">
          <CWButton
            type="button"
            label="Back"
            buttonWidth="wide"
            buttonType="secondary"
            onClick={() => onStepChange(CreateTopicStep.WVConsent)}
          />
          <CWButton
            type="button"
            buttonWidth="wide"
            label="Continue"
            onClick={() => onStepChange(CreateTopicStep.WVDetails)}
          />
        </section>
      </section>
    </div>
  );
};
export default WVMethodSelection;
