import React from 'react';

import 'pages/login/login_desktop.scss';

import {
  CWProfileRow,
  CWProfilesList,
} from 'views/components/component_kit/cw_profiles_list';
import { CWAddress } from 'views/components/component_kit/cw_address';
import { CWAvatarUsernameInput } from 'views/components/component_kit/cw_avatar_username_input';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWSpinner } from 'views/components/component_kit/cw_spinner';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { CWWalletsList } from 'views/components/component_kit/cw_wallets_list';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';

import { LoginBoilerplate } from './login_boilerplate';
import { LoginDesktopSidebar } from './login_desktop_sidebar';
import type { LoginProps } from './types';

export const LoginDesktop = ({
  address,
  activeStep,
  setActiveStep,
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
  onSaveProfileInfo,
  onPerformLinking,
  isMagicLoading,
  canResetWalletConnect,
  onModalClose,
  onConnectAnotherWay,
  onResetWalletConnect,
  onWalletSelect,
  onWalletAddressSelect,
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
            <LoginBoilerplate />
            <CWWalletsList
              onConnectAnotherWay={onConnectAnotherWay}
              wallets={wallets}
              canResetWalletConnect={canResetWalletConnect}
              onResetWalletConnect={onResetWalletConnect}
              onWalletSelect={onWalletSelect}
              onWalletAddressSelect={onWalletAddressSelect}
            />
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
            <div className="header-container">
              <CWText
                type="h3"
                fontWeight="semiBold"
                className="header-text"
                isCentered
              >
                Connect With Email?
              </CWText>
              <LoginBoilerplate />
            </div>
            {!isMagicLoading ? (
              <CWTextInput
                label="email address"
                placeholder="your-email@email.com"
                onInput={handleSetEmail}
                onenterkey={onEmailLogin}
              />
            ) : (
              <CWSpinner />
            )}
            <div className="buttons-row">
              <CWButton
                label="Back"
                buttonType="secondary-blue"
                onClick={() => {
                  setActiveStep('walletList');
                }}
              />
              <CWButton label="Connect" onClick={onEmailLogin} />
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
            <CWButton label="Finish" onClick={onSaveProfileInfo} />
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
