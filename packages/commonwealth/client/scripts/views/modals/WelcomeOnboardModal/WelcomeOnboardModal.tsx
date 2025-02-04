import { WalletId } from '@hicommonwealth/shared';
import commonLogo from 'assets/img/branding/common-logo.svg';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import useUserStore from 'state/ui/user';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { JoinCommunityStep } from './steps/JoinCommunityStep';
import { MagicWalletCreationStep } from './steps/MagicWalletCreationStep';
import { PersonalInformationStep } from './steps/PersonalInformationStep';
import { PreferencesStep } from './steps/PreferencesStep';
import { TermsOfServicesStep } from './steps/TermsOfServicesStep';
import { WelcomeOnboardModalProps, WelcomeOnboardModalSteps } from './types';

import './WelcomeOnboardModal.scss';

const WelcomeOnboardModal = ({ isOpen, onClose }: WelcomeOnboardModalProps) => {
  const [activeStep, setActiveStep] = useState<WelcomeOnboardModalSteps>(
    WelcomeOnboardModalSteps.TermsOfServices,
  );

  const user = useUserStore();

  const [hasMagic, setHasMagic] = useState(false);

  useEffect(() => {
    if (user.addresses?.[0]?.walletId === WalletId.Magic) {
      setHasMagic(true);
    }
  }, [user]);

  const handleClose = () => {
    // we require the user's to add their usernames in personal information step
    if (activeStep === WelcomeOnboardModalSteps.PersonalInformation) return;

    onClose();
  };

  const getCurrentStep = () => {
    switch (activeStep) {
      case WelcomeOnboardModalSteps.TermsOfServices: {
        return {
          index: 1,
          title: 'Terms of Service',
          component: (
            <TermsOfServicesStep
              onComplete={() => {
                setActiveStep(WelcomeOnboardModalSteps.PersonalInformation);
              }}
            />
          ),
        };
      }
      case WelcomeOnboardModalSteps.PersonalInformation: {
        return {
          index: 2,

          title: 'Welcome to Common!',
          component: (
            <PersonalInformationStep
              onComplete={() =>
                setActiveStep(WelcomeOnboardModalSteps.Preferences)
              }
            />
          ),
        };
      }

      case WelcomeOnboardModalSteps.Preferences: {
        return {
          index: 3,
          title: 'Customize your experience',
          component: (
            <PreferencesStep
              onComplete={() =>
                setActiveStep(WelcomeOnboardModalSteps.MagicWallet)
              }
            />
          ),
        };
      }
      case WelcomeOnboardModalSteps.MagicWallet: {
        return hasMagic
          ? {
              index: 4,
              title: 'Magic Wallet Creation',
              component: (
                <MagicWalletCreationStep
                  onComplete={() =>
                    setActiveStep(WelcomeOnboardModalSteps.JoinCommunity)
                  }
                />
              ),
            }
          : setActiveStep(WelcomeOnboardModalSteps.JoinCommunity);
      }

      case WelcomeOnboardModalSteps.JoinCommunity: {
        return {
          index: 5,
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
            disabled={activeStep === WelcomeOnboardModalSteps.TermsOfServices}
          />

          <div className="logo-container">
            <img src={commonLogo} className="logo" />
          </div>

          <CWText type="h2" className="modal-heading">
            {getCurrentStep()?.title}
          </CWText>
          <div
            className={clsx(
              'progress',
              hasMagic ? 'progress--with-magic' : 'progress--without-magic',
            )}
          >
            {[1, 2, 3, ...(hasMagic ? [4, 5] : [5])].map((step) => (
              <span
                key={step}
                className={clsx({
                  completed: (getCurrentStep()?.index ?? 5) >= step,
                })}
              />
            ))}
          </div>
          {getCurrentStep()?.component}
        </section>
      }
    />
  );
};

export { WelcomeOnboardModal };
