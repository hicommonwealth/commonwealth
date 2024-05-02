import clsx from 'clsx';
import React, { useState } from 'react';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import './WelcomeOnboardModal.scss';
import { JoinCommunityStep } from './steps/JoinCommunityStep';
import { PersonalInformationStep } from './steps/PersonalInformationStep';
import { WelcomeOnboardModalProps, WelcomeOnboardModalSteps } from './types';

const WelcomeOnboardModal = ({ isOpen, onClose }: WelcomeOnboardModalProps) => {
  const [activeStep, setActiveStep] = useState<WelcomeOnboardModalSteps>(
    WelcomeOnboardModalSteps.PersonalInformation,
  );

  const handleClose = () => {
    // we require the user's to add their usernames in personal information step
    if (activeStep === WelcomeOnboardModalSteps.PersonalInformation) return;

    onClose();
  };

  const getCurrentStep = () => {
    switch (activeStep) {
      case WelcomeOnboardModalSteps.PersonalInformation: {
        return {
          index: 1,
          title: 'Welcome to Common!',
          component: (
            <PersonalInformationStep
              onComplete={() =>
                setActiveStep(WelcomeOnboardModalSteps.Interests)
              }
            />
          ),
        };
      }

      case WelcomeOnboardModalSteps.Interests: {
        return {
          // TODO: in https://github.com/hicommonwealth/commonwealth/issues/6647
          index: 2,
          title: '',
          component: <></>,
        };
      }

      case WelcomeOnboardModalSteps.JoinCommunity: {
        return {
          index: 3,
          title: 'Join a community',
          component: <JoinCommunityStep onComplete={handleClose} />,
        };
      }
    }
  };

  return (
    <CWModal
      open={isOpen}
      onClose={handleClose}
      size="medium"
      className="WelcomeOnboardModal"
      content={
        <section className="content">
          <CWIcon
            iconName="close"
            onClick={handleClose}
            className="close-btn"
            disabled={
              activeStep === WelcomeOnboardModalSteps.PersonalInformation
            }
          />
          <CWText type="h2">{getCurrentStep().title}</CWText>
          <div className="progress">
            {[1, 2, 3].map((step) => (
              <span
                key={step}
                className={clsx({ completed: getCurrentStep().index >= step })}
              />
            ))}
          </div>
          {getCurrentStep().component}
        </section>
      }
    />
  );
};

export { WelcomeOnboardModal };
