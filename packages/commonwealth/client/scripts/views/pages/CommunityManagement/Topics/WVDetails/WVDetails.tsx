import React from 'react';

import { CreateTopicStep } from '../utils';
import './WVDetails.scss';

interface WVConsentProps {
  onStepChange: (step: CreateTopicStep) => void;
}

const WVDetails = ({ onStepChange }: WVConsentProps) => {
  return (
    <div className="WVDetails">
      WVDetails
      <p onClick={() => onStepChange(CreateTopicStep.WVConsent)}>prev</p>
    </div>
  );
};
export default WVDetails;
