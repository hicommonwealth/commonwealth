/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';

import 'pages/login/login_mobile.scss';

import { CWAccountCreationButton } from '../../components/component_kit/cw_account_creation_button';
import { CWAddress } from '../../components/component_kit/cw_address';
import { CWAvatarUsernameInput } from '../../components/component_kit/cw_avatar_username_input';
import { CWButton } from '../../components/component_kit/cw_button';
import { ModalExitButton } from '../../components/component_kit/cw_modal';
import {
  CWProfileRow,
  CWProfilesList,
} from '../../components/component_kit/cw_profiles_list';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWWalletsList } from '../../components/component_kit/cw_wallets_list';
import { isWindowExtraSmall } from '../../components/component_kit/helpers';
import { getText } from './helpers';
import { LoginBoilerplate } from './login_boilerplate';
import { LoginEthAlert } from './login_eth_alert';
import { LoginText } from './login_text';
import type { LoginAttrs } from './types';

export class LoginMobile extends ClassComponent<LoginAttrs> {
  view(vnode: ResultNode<LoginAttrs>) {
    const {
      address,
      bodyType,
      setBodyType,
      handleSetAvatar,
      handleSetUsername,
      profiles,
      setProfiles,
      handleSetEmail,
      setSidebarType,
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
    } = vnode.attrs;

    const hasBoilerplate =
      bodyType === 'walletList' ||
      bodyType === 'connectWithEmail' ||
      bodyType === 'ethWalletList';

    const hasCreationButtons = bodyType === 'selectAccountType';

    const { headerText, bodyText } = getText(bodyType);

    return (
      <div className="LoginMobile">
        <ModalExitButton iconButtonTheme="hasBackground" />
        {bodyType === 'ethWalletList' && <LoginEthAlert />}
        <div className={bodyType}>
          <LoginText headerText={headerText} bodyText={bodyText} isMobile />
          {hasCreationButtons && (
            <div className="account-creation-buttons-row">
              <CWAccountCreationButton onClick={createNewAccountCallback} />
              <CWAccountCreationButton
                creationType="linkAccount"
                onClick={linkExistingAccountCallback}
              />
            </div>
          )}
          {bodyType === 'walletList' && (
            <CWWalletsList
              connectAnotherWayOnclick={() => {
                setBodyType('connectWithEmail');
              }}
              wallets={wallets}
              darkMode={true}
              setSelectedWallet={setSelectedWallet}
              setBodyType={setBodyType}
              accountVerifiedCallback={accountVerifiedCallback}
              showResetWalletConnect={showResetWalletConnect}
              linking={false}
            />
          )}
          {bodyType === 'selectPrevious' && (
            <CWWalletsList
              connectAnotherWayOnclick={() => {
                setBodyType('connectWithEmail');
              }}
              wallets={wallets}
              darkMode
              setSelectedWallet={setSelectedLinkingWallet}
              setBodyType={setBodyType}
              accountVerifiedCallback={accountVerifiedCallback}
              showResetWalletConnect={showResetWalletConnect}
              linking={true}
            />
          )}
          {bodyType === 'welcome' && (
            <div className="inner-body-container">
              <CWAvatarUsernameInput
                address={address}
                darkMode
                value={username}
                onAvatarChangeHandler={(a) => {
                  handleSetAvatar(a);
                }}
                onUsernameChangeHandler={(u) => {
                  handleSetUsername(u);
                }}
                orientation="vertical"
              />
              <CWButton label="Finish" onClick={saveProfileInfoCallback} />
            </div>
          )}
          {bodyType === 'selectProfile' && (
            <div className="inner-body-container">
              <div className="inner-inner-body-container">
                <CWText
                  type="h5"
                  fontWeight="medium"
                  className="inner-body-text"
                >
                  Linking
                </CWText>
                <CWAddress address={address} darkMode />
                <CWText
                  type="h5"
                  fontWeight="medium"
                  className="inner-body-text"
                >
                  to your Profile
                </CWText>
                <CWProfilesList profiles={profiles} darkMode />
              </div>
              <CWButton label="Finish" onClick={performLinkingCallback} />
            </div>
          )}
          {bodyType === 'connectWithEmail' && (
            <div className="inner-body-container">
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
                  buttonType="secondary-blue-dark"
                  onClick={() => {
                    setBodyType('walletList');
                  }}
                />
                <CWButton
                  label="Connect"
                  onClick={handleEmailLoginCallback}
                  buttonType="primary-blue-dark"
                />
              </div>
            </div>
          )}
          {bodyType === 'allSet' && (
            <div className="inner-body-container">
              <div className="inner-inner-body-container">
                <CWText
                  type="h5"
                  fontWeight="medium"
                  className="inner-body-text"
                >
                  You have sucessfully linked
                </CWText>
                <CWAddress address={address} darkMode />
                <CWText
                  type="h5"
                  fontWeight="medium"
                  className="inner-body-text"
                >
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
  }
}
