import 'pages/login/login_desktop.scss';
import React from 'react';
import { CWAddress } from 'views/components/component_kit/cw_address';
import { CWAvatarUsernameInput } from 'views/components/component_kit/cw_avatar_username_input';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

import { CWProfileRow, CWProfilesList, } from 'views/components/component_kit/cw_profiles_list';
import { CWSpinner } from 'views/components/component_kit/cw_spinner';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { CWWalletsList } from 'views/components/component_kit/cw_wallets_list';

import { LoginBoilerplate } from './login_boilerplate';
import { LoginDesktopSidebar } from './login_desktop_sidebar';
import type { LoginProps } from './types';

export const LoginDesktop = ({
  address,
  bodyType,
  setBodyType,
  handleSetAvatar,
  handleSetUsername,
  profiles,
  handleSetEmail,
  sidebarType,
  username,
  wallets,
  setSelectedWallet,
  createNewAccountCallback,
  linkExistingAccountCallback,
  accountVerifiedCallback,
  handleEmailLoginCallback,
  saveProfileInfoCallback,
  performLinkingCallback,
  setSelectedLinkingWallet,
  magicLoading,
  showResetWalletConnect,
  onModalClose,
}: LoginProps) => {
  return (
    <div className="LoginDesktop">
      <LoginDesktopSidebar
        sidebarType={sidebarType}
        createNewAccountCallback={createNewAccountCallback}
        linkExistingAccountCallback={linkExistingAccountCallback}
        wallets={wallets}
      />
      <div className="body">
        <CWIconButton iconName="close" onClick={onModalClose} />

        {bodyType === 'walletList' && (
          <div className="inner-body-container centered">
            <LoginBoilerplate />
            <CWWalletsList
              connectAnotherWayOnclick={() => {
                setBodyType('connectWithEmail');
              }}
              wallets={wallets}
              setSelectedWallet={setSelectedWallet}
              setBodyType={setBodyType}
              accountVerifiedCallback={accountVerifiedCallback}
              linking={false}
              showResetWalletConnect={showResetWalletConnect}
            />
          </div>
        )}

        {bodyType === 'selectAccountType' && (
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

        {bodyType === 'connectWithEmail' && (
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
            {!magicLoading ? (
              <CWTextInput
                label="email address"
                placeholder="your-email@email.com"
                onInput={handleSetEmail}
                onenterkey={handleEmailLoginCallback}
              />
            ) : (
              <CWSpinner />
            )}
            <div className="buttons-row">
              <CWButton
                label="Back"
                buttonType="secondary-blue"
                onClick={() => {
                  setBodyType('walletList');
                }}
              />
              <CWButton label="Connect" onClick={handleEmailLoginCallback} />
            </div>
          </div>
        )}

        {bodyType === 'welcome' && (
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
            <CWButton label="Finish" onClick={saveProfileInfoCallback} />
          </div>
        )}

        {bodyType === 'ethWalletList' && (
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
              setSelectedWallet={setSelectedWallet}
              hasNoWalletsLink={false}
              wallets={wallets}
              showResetWalletConnect={showResetWalletConnect}
            />
          </div>
        )}
        {bodyType === 'selectPrevious' && (
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
              connectAnotherWayOnclick={() => {
                setBodyType('connectWithEmail');
              }}
              wallets={wallets}
              setSelectedWallet={setSelectedLinkingWallet}
              setBodyType={setBodyType}
              accountVerifiedCallback={accountVerifiedCallback}
              linking
              showResetWalletConnect={showResetWalletConnect}
            />
          </div>
        )}

        {bodyType === 'selectProfile' && (
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
            <CWButton label="Finish" onClick={performLinkingCallback} />
          </div>
        )}

        {bodyType === 'allSet' && (
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
