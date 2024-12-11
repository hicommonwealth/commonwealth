import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import './ConnectTokenForm.scss';
import ConnectTokenStep from './ConnectTokenStep';
import InformationalCTAStep from './InformationalCTAStep';
import { ConnectTokenFormProps, ConnectTokenFormSteps } from './types';

const ConnectTokenForm = ({
  onTokenConnect,
  existingToken,
  onCancel,
}: ConnectTokenFormProps) => {
  const navigate = useCommonNavigate();
  const [activeStep, setActiveStep] = useState<ConnectTokenFormSteps>(
    existingToken
      ? ConnectTokenFormSteps.ConnectToken
      : ConnectTokenFormSteps.InformationalCTA,
  );

  const getActiveStep = () => {
    switch (activeStep) {
      case ConnectTokenFormSteps.InformationalCTA: {
        return (
          <InformationalCTAStep
            onCancel={() => navigate(`/manage/integrations`)}
            onConnect={() => setActiveStep(ConnectTokenFormSteps.ConnectToken)}
          />
        );
      }
      case ConnectTokenFormSteps.ConnectToken: {
        return (
          <ConnectTokenStep
            onCancel={() =>
              existingToken
                ? onCancel?.()
                : setActiveStep(ConnectTokenFormSteps.InformationalCTA)
            }
            onConnect={() => onTokenConnect?.()}
            existingToken={existingToken}
          />
        );
      }
      default:
        console.error(`${activeStep}: not implemented for ConnectTokenForm`);
        return <></>;
    }
  };

  return <section className="ConnectTokenForm">{getActiveStep()}</section>;
};

export default ConnectTokenForm;
