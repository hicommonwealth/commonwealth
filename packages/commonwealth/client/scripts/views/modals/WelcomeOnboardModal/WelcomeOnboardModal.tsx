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

import useBrowserWindow from 'client/scripts/hooks/useBrowserWindow';
import './WelcomeOnboardModal.scss';
import { InviteModal } from './steps/InviteModal';
import { OptionalWalletModal } from './steps/OptionalWalletModal/OptionalWalletModal';
import { NotificationModal } from './steps/notificationModal';

const WelcomeOnboardModal = ({ isOpen, onClose }: WelcomeOnboardModalProps) => {
  const { isWindowSmallInclusive } = useBrowserWindow({});
  const [isUserFirstTime, SetIsUserFirstTime] = useState(true);
  const [isUserFromWebView, setIsUserFromWebView] = useState(true);
  const [activeStep, setActiveStep] = useState<WelcomeOnboardModalSteps>(
    WelcomeOnboardModalSteps.OptionalWalletModal,
  );

  useEffect(() => {
    const isFromWebView = Boolean(window?.ReactNativeWebView);
    setIsUserFromWebView(true);
    if (isUserFirstTime) {
      setActiveStep(
        isFromWebView
          ? WelcomeOnboardModalSteps.OptionalWalletModal
          : WelcomeOnboardModalSteps.TermsOfServices,
      );
    } else {
      setActiveStep(WelcomeOnboardModalSteps.TermsOfServices);
    }
  }, []);

  const user = useUserStore();
  // const hasMagic = user.addresses?.[0]?.walletId === WalletId.Magic;

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
      case WelcomeOnboardModalSteps.OptionalWalletModal: {
        if (isUserFirstTime && isUserFromWebView) {
          return {
            index: 1,
            title: 'Connect Wallet',
            component: (
              <OptionalWalletModal
                onComplete={() => {
                  setActiveStep(WelcomeOnboardModalSteps.Notifications);
                }}
                SetIsUserFirstTime={SetIsUserFirstTime}
                isUserFirstTime={isUserFirstTime}
                isUserFromWebView={isUserFromWebView}
                setIsUserFromWebView={setIsUserFromWebView}
              />
            ),
          };
        }
        break;
      }
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
