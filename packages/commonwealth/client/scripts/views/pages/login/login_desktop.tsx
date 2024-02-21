import React from 'react';

import 'pages/login/login_desktop.scss';

import { CWAddress } from 'views/components/component_kit/cw_address';
import { CWAvatarUsernameInput } from 'views/components/component_kit/cw_avatar_username_input';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import {
  CWProfileRow,
  CWProfilesList,
} from 'views/components/component_kit/cw_profiles_list';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { CWWalletsList } from 'views/components/component_kit/cw_wallets_list';

import CWLoadingSpinner from '../../components/component_kit/new_designs/CWLoadingSpinner';
import { LoginBoilerplate } from './login_boilerplate';
import { LoginDesktopSidebar } from './login_desktop_sidebar';
import type { LoginProps } from './types';

export const LoginDesktop = ({
  address,
  activeStep,
  handleSetAvatar,
  handleSetUsername,
  profiles,
  handleSetEmail,
  sidebarType,
  username,
  wallets,
  onCreateNewAccount,
  onLinkExistingAccount,
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
  onNavigateToWalletList,
}: LoginProps) => {
  return (
    <div className="LoginDesktop">
      <LoginDesktopSidebar
        sidebarType={sidebarType}
        onCreateNewAccount={onCreateNewAccount}
        onLinkExistingAccount={onLinkExistingAccount}
        wallets={wallets}
      />
      <div className="body">
        <CWIconButton iconName="close" onClick={onModalClose} />

        {activeStep === 'walletList' && (
          <div className="inner-body-container centered">
            <CWWalletsList
              onConnectAnotherWay={onConnectAnotherWay}
              wallets={wallets}
              canResetWalletConnect={canResetWalletConnect}
              onResetWalletConnect={onResetWalletConnect}
              onWalletSelect={onWalletSelect}
              onWalletAddressSelect={onWalletAddressSelect}
              onSocialLogin={onSocialLogin}
            />
            <LoginBoilerplate />
          </div>
        )}

        {activeStep === 'selectAccountType' && (
          <div className="inner-body-container centered">
            <div className="header-container">
              <CWText
                type="h3"
                fontWeight="semiBold"
                className="header-text"
                isCentered
              >
                Looks like this address hasn't been connected before.
              </CWText>
            </div>
            <div className="select-row">
              <CWIcon iconName="arrowLeft" />
              <CWText
                type="h5"
                fontWeight="semiBold"
                className="select-text"
                isCentered
              >
                Select Account Type
              </CWText>
            </div>
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
              <CWLoadingSpinner />
            )}
            <div className="header-container">
              <LoginBoilerplate />
            </div>
          </div>
        )}

        {activeStep === 'welcome' && (
          <div className="inner-body-container">
            <div className="header-container">
              <CWText
                type="h3"
                fontWeight="bold"
                className="header-text"
                isCentered
              >
                Welcome to Common!
              </CWText>
              <CWText type="b2" className="subheader-text" isCentered>
                Use a generated username and photo to edit later, or edit now
              </CWText>
            </div>
            <CWAvatarUsernameInput
              address={address}
              value={username}
              onAvatarChangeHandler={handleSetAvatar}
              onUsernameChangeHandler={handleSetUsername}
            />
            <CWButton
              label="Finish"
              onClick={async () => await onSaveProfileInfo()}
            />
          </div>
        )}

        {activeStep === 'ethWalletList' && (
          <div className="inner-body-container">
            <div className="header-container">
              <CWText
                type="h3"
                fontWeight="semiBold"
                className="header-text-eth"
                isCentered
              >
                Select an Ethereum Wallet
              </CWText>
              <CWText type="caption" className="subheader-text" isCentered>
                Manage your profiles, addresses and communities under one
                account.
              </CWText>
            </div>
            <CWWalletsList
              hasNoWalletsLink={false}
              wallets={wallets}
              canResetWalletConnect={canResetWalletConnect}
              onResetWalletConnect={onResetWalletConnect}
              onWalletAddressSelect={onWalletAddressSelect}
              onWalletSelect={onWalletSelect}
              onSocialLogin={onSocialLogin}
            />
          </div>
        )}
        {activeStep === 'selectPrevious' && (
          <div className="inner-body-container">
            <div className="header-container">
              <CWText
                type="h3"
                fontWeight="semiBold"
                className="header-text"
                isCentered
              >
                Select a Previously Linked Address
              </CWText>
              <CWText type="caption" className="subheader-text" isCentered>
                Manage your profiles, addresses and communities under one
                account.
              </CWText>
            </div>
            <CWWalletsList
              onConnectAnotherWay={onConnectAnotherWay}
              wallets={wallets}
              canResetWalletConnect={canResetWalletConnect}
              onResetWalletConnect={onResetWalletConnect}
              onWalletAddressSelect={onWalletAddressSelect}
              onWalletSelect={onWalletSelect}
              onSocialLogin={onSocialLogin}
            />
          </div>
        )}

        {activeStep === 'selectProfile' && (
          <div className="inner-body-container">
            <div className="header-container">
              <CWText
                type="h3"
                fontWeight="bold"
                className="header-text"
                isCentered
              >
                Select Profile
              </CWText>
              <CWText type="h5" fontWeight="medium" isCentered>
                Linking
              </CWText>
              <CWAddress address={address} />
              <CWText type="h5" fontWeight="medium" isCentered>
                to your Profile
              </CWText>
            </div>
            <CWProfilesList profiles={profiles} />
            <CWButton label="Finish" onClick={onPerformLinking} />
          </div>
        )}

        {activeStep === 'allSet' && (
          <div className="inner-body-container">
            <div className="header-container">
              <CWText
                type="h3"
                fontWeight="bold"
                className="header-text"
                isCentered
              >
                You’re All Set!
              </CWText>
              <CWText type="h5" fontWeight="medium" isCentered>
                You have successfully linked
              </CWText>
              <CWAddress address={address} />
              <CWText type="h5" fontWeight="medium" isCentered>
                to your Profile
              </CWText>
            </div>
            <CWProfileRow {...profiles[0]} />
            <CWButton label="Finish" />
          </div>
        )}
      </div>
    </div>
  );
};
