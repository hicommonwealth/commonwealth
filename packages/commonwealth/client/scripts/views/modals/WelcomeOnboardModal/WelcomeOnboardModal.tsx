import { WalletId } from '@hicommonwealth/shared';
import commonLogo from 'assets/img/branding/common-logo.svg';
import useBrowserWindow from 'client/scripts/hooks/useBrowserWindow';
import clsx from 'clsx';
import { useFlag } from 'hooks/useFlag';
import React, { useEffect, useState } from 'react';
import useUserStore from 'state/ui/user';
import { CWText } from '../../components/component_kit/cw_text';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import './WelcomeOnboardModal.scss';
import { InviteModal } from './steps/InviteModal';
import { JoinCommunityStep } from './steps/JoinCommunityStep';
import { MagicWalletCreationStep } from './steps/MagicWalletCreationStep';
import { PersonalInformationStep } from './steps/PersonalInformationStep';
import { PreferencesStep } from './steps/PreferencesStep';
import { TermsOfServicesStep } from './steps/TermsOfServicesStep';
import { WelcomeOnboardModalProps, WelcomeOnboardModalSteps } from './types';

const WelcomeOnboardModal = ({ isOpen, onClose }: WelcomeOnboardModalProps) => {
  const { isWindowSmallInclusive } = useBrowserWindow({});
  const referralsEnabled = useFlag('referrals');

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
          index: 2,
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
          index: 3,
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
          index: 4,
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
              index: 5,
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
          index: 6,
          title: 'Join a community',
          component: (
            <JoinCommunityStep
              onComplete={() =>
                referralsEnabled
                  ? setActiveStep(WelcomeOnboardModalSteps.InviteModal)
                  : handleClose()
              }
            />
          ),
        };
      }
      case WelcomeOnboardModalSteps.InviteModal: {
        if (!referralsEnabled) {
          return handleClose();
        }

        return {
          index: 7,
          title: '',
          component: <InviteModal onComplete={handleClose} />,
        };
      }
    }
  };

  return (
    <CWModal
      open={isOpen}
      onClose={handleClose}
      size="medium"
      className={clsx(
        'WelcomeOnboardModal',
        activeStep === WelcomeOnboardModalSteps.TermsOfServices
          ? 'extra-padding'
          : '',
      )}
      isFullScreen={isWindowSmallInclusive}
      content={
        <>
          <section className="content">
            <img src={commonLogo} className="logo" />
            <CWText type="h2" className="modal-heading">
              {getCurrentStep()?.title}
            </CWText>
            {getCurrentStep()?.component}
          </section>
        </>
      }
    />
  );
};

export { WelcomeOnboardModal };
