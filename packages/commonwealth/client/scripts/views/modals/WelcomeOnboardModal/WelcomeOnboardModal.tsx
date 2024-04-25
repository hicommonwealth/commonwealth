import clsx from 'clsx';
import React, { useState } from 'react';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import './WelcomeOnboardModal.scss';

type WelcomeOnboardModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const WelcomeOnboardModal = ({ isOpen, onClose }: WelcomeOnboardModalProps) => {
  const [activeStep] = useState(1);

  return (
    <CWModal
      open={isOpen}
      onClose={onClose}
      size="medium"
      className="WelcomeOnboardModal"
      content={
        <section className="content">
          <CWIcon
            iconName="close"
            onClick={onClose}
            className="close-btn"
            disabled={activeStep === 1}
          />
          <CWText type="h2">Welcome to Common!</CWText>
          <div className="progress">
            <span className={clsx({ completed: activeStep > 0 })} />
            <span className={clsx({ completed: activeStep > 1 })} />
            <span className={clsx({ completed: activeStep > 2 })} />
          </div>
        </section>
      }
    />
  );
};

export { WelcomeOnboardModal };
