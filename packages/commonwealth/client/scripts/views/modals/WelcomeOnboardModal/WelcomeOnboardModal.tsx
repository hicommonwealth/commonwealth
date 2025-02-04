import { WalletId } from '@hicommonwealth/shared';
import commonLogo from 'assets/img/branding/common-logo.svg';
import React, { useEffect, useState } from 'react';
import useUserStore from 'state/ui/user';
import { CWText } from '../../components/component_kit/cw_text';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { JoinCommunityStep } from './steps/JoinCommunityStep';
import { MagicWalletCreationStep } from './steps/MagicWalletCreationStep';
import { PersonalInformationStep } from './steps/PersonalInformationStep';
import { PreferencesStep } from './steps/PreferencesStep';
import { TermsOfServicesStep } from './steps/TermsOfServicesStep';
import { WelcomeOnboardModalProps, WelcomeOnboardModalSteps } from './types';

import { LocalStorageKeys } from 'client/scripts/helpers/localStorage';
import useBrowserWindow from 'client/scripts/hooks/useBrowserWindow';
import { isMobileApp } from 'client/scripts/hooks/useReactNativeWebView';
import './WelcomeOnboardModal.scss';
import { InviteModal } from './steps/InviteModal';
import { NotificationModal } from './steps/NotificationModal';
const WelcomeOnboardModal = ({ isOpen, onClose }: WelcomeOnboardModalProps) => {
  const { isWindowSmallInclusive } = useBrowserWindow({});
  const [activeStep, setActiveStep] = useState<WelcomeOnboardModalSteps>(
    WelcomeOnboardModalSteps.OptionalWalletModal,
  );
  const mobileApp = isMobileApp();
  const user = useUserStore();
  useEffect(() => {
    const hasSeenNotifications = localStorage.getItem(
      LocalStorageKeys.HasSeenNotifications,
    );
    if (mobileApp && !hasSeenNotifications && user.id > 0) {
      localStorage.setItem(LocalStorageKeys.HasSeenNotifications, 'true');
    }
    setActiveStep(
      mobileApp && !hasSeenNotifications
        ? WelcomeOnboardModalSteps.Notifications
        : WelcomeOnboardModalSteps.TermsOfServices,
    );
  }, [mobileApp]);

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
      case WelcomeOnboardModalSteps.Notifications: {
        return {
          index: 2,
          title: 'Enable Notifications',
          component: (
            <NotificationModal
              onComplete={() => {
                setActiveStep(WelcomeOnboardModalSteps.TermsOfServices);
              }}
            />
          ),
        };
      }
      case WelcomeOnboardModalSteps.TermsOfServices: {
        return {
          index: 3,
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
          index: 4,
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
          index: 5,
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
              index: 6,
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
          index: 7,
          title: 'Join a community',
          component: (
            <JoinCommunityStep
              onComplete={() =>
                setActiveStep(WelcomeOnboardModalSteps.InviteModal)
              }
            />
          ),
        };
      }
      case WelcomeOnboardModalSteps.InviteModal: {
        return {
          index: 8,
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
      className="WelcomeOnboardModal"
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
