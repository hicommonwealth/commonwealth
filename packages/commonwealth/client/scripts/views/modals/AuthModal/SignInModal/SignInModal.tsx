import { WalletSsoSource } from '@hicommonwealth/shared';
import { isMobileApp } from 'hooks/useReactNativeWebView';
import React, { useEffect } from 'react';
import { ModalBase } from '../common/ModalBase';
import { AuthModalType, ModalVariantProps } from '../types';
import './SignInModal.scss';

const mobileApp = isMobileApp();

const SignInModal = ({
  onClose,
  onSuccess,
  showWalletsFor,
  showAuthOptionFor,
  onSignInClick,
  onSocialLogin,
}: ModalVariantProps) => {
  useEffect(() => {
    // Check for Telegram auth data
    const telegramData = sessionStorage.getItem('telegram-auth-data');
    if (telegramData) {
      try {
        const userData = JSON.parse(telegramData);
        // Clear the data immediately to prevent reuse
        sessionStorage.removeItem('telegram-auth-data');

        // Handle Telegram auth
        onSocialLogin(WalletSsoSource.Telegram, userData).catch(console.error);
      } catch (error) {
        console.error('Failed to process Telegram auth data:', error);
      }
    }
  }, [onSocialLogin]);

  return (
    <ModalBase
      onClose={onClose}
      layoutType={AuthModalType.SignIn}
      onSuccess={onSuccess}
      showAuthOptionTypesFor={mobileApp ? ['sso'] : ['wallets', 'sso']}
      showWalletsFor={showWalletsFor}
      showAuthOptionFor={showAuthOptionFor}
      bodyClassName="SignInModal"
      onSignInClick={onSignInClick}
    />
  );
};

export { SignInModal };
