import React from 'react';

import { CreateTopicStep } from '../utils';
import './WVConsent.scss';

interface WVConsentProps {
  onStepChange: (step: CreateTopicStep) => void;
}

const WVConsent = ({ onStepChange }: WVConsentProps) => {
  return (
    <div className="WVConsent">
      WVConsent
      <p onClick={() => onStepChange(CreateTopicStep.TopicDetails)}>prev</p>
      <p onClick={() => onStepChange(CreateTopicStep.WVDetails)}>next</p>
    </div>
  );
};
export default WVConsent;
