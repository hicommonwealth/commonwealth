import TerraWalletConnectWebWalletController from 'controllers/app/webWallets/terra_walletconnect_web_wallet';
import WalletConnectWebWalletController from 'controllers/app/webWallets/walletconnect_web_wallet';
import 'pages/login/login_mobile.scss';
import React from 'react';
import app from 'state';
import { CWAccountCreationButton } from 'views/components/component_kit/cw_account_creation_button';
import { CWAddress } from 'views/components/component_kit/cw_address';
import { CWAvatarUsernameInput } from 'views/components/component_kit/cw_avatar_username_input';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import {
  CWProfileRow,
  CWProfilesList,
} from 'views/components/component_kit/cw_profiles_list';
import { CWSpinner } from 'views/components/component_kit/cw_spinner';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { CWWalletsList } from 'views/components/component_kit/cw_wallets_list';
import { isWindowExtraSmall } from 'views/components/component_kit/helpers';
import { getLoginText } from './helpers';
import { LoginBoilerplate } from './login_boilerplate';
import { LoginEthAlert } from './login_eth_alert';
import { LoginText } from './login_text';
import type { LoginProps } from './types';

export const LoginMobile = ({
  signerAccount,
  address,
  activeStep,
  handleSetAvatar,
  handleSetUsername,
  profiles,
  handleSetEmail,
  username,
  wallets,
  onCreateNewAccount,
  onLinkExistingAccount,
  onAccountVerified,
  onEmailLogin,
  onSocialLogin,
  onSaveProfileInfo,
  onPerformLinking,
  isMagicLoading,
  canResetWalletConnect,
  onModalClose,
  onConnectAnotherWay,
  onResetWalletConnect,
  onWalletSelect,
  onWalletAddressSelect,
  isNewlyCreated,
  isLinkingOnMobile,
  onNavigateToWalletList,
  sidebarType,
}: LoginProps) => {
  const hasBoilerplate =
    activeStep === 'walletList' ||
    activeStep === 'connectWithEmail' ||
    activeStep === 'ethWalletList';

  const hasCreationButtons = activeStep === 'selectAccountType';
  const { headerText, bodyText } = getLoginText(activeStep, sidebarType);

  return (
    <div className="LoginMobile">
      <CWIconButton
        iconName="close"
        onClick={async () => {
          if (activeStep === 'redirectToSign' && !app.user.activeAccount) {
            // Reset WC if we quit the login flow before signing in
            const wallet = wallets.find(
              (w) =>
                w instanceof WalletConnectWebWalletController ||
                w instanceof TerraWalletConnectWebWalletController,
            );

            await wallet.reset();
          }
          onModalClose();
        }}
      />
      {activeStep === 'ethWalletList' && <LoginEthAlert />}
      <div className={activeStep}>
        <LoginText headerText={headerText} bodyText={bodyText} isMobile />
        {hasCreationButtons && (
          <div className="account-creation-buttons-row">
            <CWAccountCreationButton onClick={onCreateNewAccount} />
            <CWAccountCreationButton
              creationType="linkAccount"
              onClick={onLinkExistingAccount}
            />
          </div>
        )}

        {activeStep === 'walletList' && (
          <CWWalletsList
            onConnectAnotherWay={onConnectAnotherWay}
            wallets={wallets}
            darkMode
            canResetWalletConnect={canResetWalletConnect}
            onResetWalletConnect={onResetWalletConnect}
            onWalletSelect={onWalletSelect}
            onWalletAddressSelect={onWalletAddressSelect}
            onSocialLogin={onSocialLogin}
          />
        )}

        {activeStep === 'redirectToSign' && (
          <div className="inner-body-container">
            <CWButton
              label="Sign with Wallet"
              onClick={() => {
                // TODO: Handle link account case (third param here)
                onAccountVerified(
                  signerAccount,
                  isNewlyCreated,
                  isLinkingOnMobile,
                );
              }}
            />
            <CWText type="caption" className="CaptionText">
              Please wait for a signature request to appear. This can sometimes
              take several seconds.
            </CWText>
          </div>
        )}

        {activeStep === 'selectPrevious' && (
          <CWWalletsList
            onConnectAnotherWay={onConnectAnotherWay}
            wallets={wallets}
            darkMode
            canResetWalletConnect={canResetWalletConnect}
            onResetWalletConnect={onResetWalletConnect}
            onWalletSelect={onWalletSelect}
            onWalletAddressSelect={onWalletAddressSelect}
            onSocialLogin={onSocialLogin}
          />
        )}

        {activeStep === 'welcome' && (
          <div className="inner-body-container">
            <CWAvatarUsernameInput
              address={address}
              darkMode
              value={username}
              onAvatarChangeHandler={handleSetAvatar}
              onUsernameChangeHandler={handleSetUsername}
              orientation="vertical"
            />
            <CWButton
              label="Finish"
              onClick={async () => await onSaveProfileInfo()}
            />
          </div>
        )}

        {activeStep === 'selectProfile' && (
          <div className="inner-body-container">
            <div className="inner-inner-body-container">
              <CWText type="h5" fontWeight="medium" className="inner-body-text">
                Linking
              </CWText>
              <CWAddress address={address} darkMode />
              <CWText type="h5" fontWeight="medium" className="inner-body-text">
                to your Profile
              </CWText>
              <CWProfilesList profiles={profiles} darkMode />
            </div>
            <CWButton label="Finish" onClick={onPerformLinking} />
          </div>
        )}
        {activeStep === 'connectWithEmail' && (
          <div className="inner-body-container">
            {!isMagicLoading ? (
              <div className="email-form-wrapper">
                <CWTextInput
                  autoFocus={true}
                  label="Email address"
                  placeholder="Email address"
                  className="login-email-field"
                  onInput={handleSetEmail}
                  onenterkey={async () => await onEmailLogin()}
                />
                <div className="buttons-row email-form-buttons">
                  <CWButton
                    label="Sign in with Magic"
                    buttonType="secondary-blue"
                    className="wallet-magic-btn"
                    onClick={async () => await onEmailLogin()}
                  />
                  <CWButton
                    iconLeft="arrowLeft"
                    label="Back to sign in options"
                    buttonType="secondary-blue"
                    className="wallet-back-btn"
                    onClick={onNavigateToWalletList}
                  />
                </div>
              </div>
            ) : (
              <CWSpinner />
            )}
          </div>
        )}

        {activeStep === 'allSet' && (
          <div className="inner-body-container">
            <div className="inner-inner-body-container">
              <CWText type="h5" fontWeight="medium" className="inner-body-text">
                You have successfully linked
              </CWText>
              <CWAddress address={address} darkMode />
              <CWText type="h5" fontWeight="medium" className="inner-body-text">
                to your Profile
              </CWText>
              <CWProfileRow darkMode {...profiles[0]} />
            </div>
            <CWButton label="Finish" />
          </div>
        )}
      </div>

      {hasBoilerplate && !isWindowExtraSmall(window.innerWidth) && (
        <LoginBoilerplate darkMode />
      )}
    </div>
  );
};
