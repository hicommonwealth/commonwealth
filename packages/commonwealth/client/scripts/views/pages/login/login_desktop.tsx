/* @jsx m */

import ClassComponent from 'class_component';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import m from 'mithril';

import 'pages/login/login_desktop.scss';

import { CWAddress } from '../../components/component_kit/cw_address';
import { CWAvatarUsernameInput } from '../../components/component_kit/cw_avatar_username_input';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { ModalExitButton } from '../../components/component_kit/cw_modal';
import {
  CWProfileRow,
  CWProfilesList,
} from '../../components/component_kit/cw_profiles_list';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWWalletsList } from '../../components/component_kit/cw_wallets_list';
import { LoginBoilerplate } from './login_boilerplate';
import { LoginDesktopSidebar } from './login_desktop_sidebar';
import type { LoginAttrs } from './types';

export class LoginDesktop extends ClassComponent<LoginAttrs> {
  view(vnode: m.Vnode<LoginAttrs>) {
    const {
      address,
      bodyType,
      setBodyType,
      handleSetAvatar,
      handleSetUsername,
      profiles,
      setProfiles,
      handleSetEmail,
      sidebarType,
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

    return (
      <div class="LoginDesktop">
        <LoginDesktopSidebar
          sidebarType={sidebarType}
          createNewAccountCallback={createNewAccountCallback}
          linkExistingAccountCallback={linkExistingAccountCallback}
          wallets={wallets}
        />
        <div class="body">
          <ModalExitButton />
          {bodyType === 'walletList' && (
            <div class="inner-body-container centered">
              <LoginBoilerplate />
              <CWWalletsList
                connectAnotherWayOnclick={() => {
                  setBodyType('connectWithEmail');
                }}
                wallets={wallets}
                setSelectedWallet={setSelectedWallet}
                setProfiles={setProfiles}
                setSidebarType={setSidebarType}
                setBodyType={setBodyType}
                accountVerifiedCallback={accountVerifiedCallback}
                linking={false}
                showResetWalletConnect={showResetWalletConnect}
              />
            </div>
          )}
          {bodyType === 'selectAccountType' && (
            <div class="inner-body-container centered">
              <div class="header-container">
                <CWText
                  type="h3"
                  fontWeight="semiBold"
                  className="header-text"
                  isCentered
                >
                  Looks like this address hasn't been connected before.
                </CWText>
              </div>
              <div class="select-row">
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
            <div class="inner-body-container">
              <div class="header-container">
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
                  oninput={handleSetEmail}
                  onenterkey={handleEmailLoginCallback}
                />
              ) : (
                <CWSpinner />
              )}
              <div class="buttons-row">
                <CWButton
                  label="Back"
                  buttonType="secondary-blue"
                  onclick={() => {
                    setBodyType('walletList');
                  }}
                />
                <CWButton label="Connect" onclick={handleEmailLoginCallback} />
              </div>
            </div>
          )}
          {bodyType === 'welcome' && (
            <div class="inner-body-container">
              <div class="header-container">
                <CWText
                  type="h3"
                  fontWeight="bold"
                  className="header-text"
                  isCentered
                >
                  Welcome to Common!
                </CWText>
                <CWText type="b2" className="subheader-text" isCentered>
                  Provide a profile image and display name. You can always edit
                  them later.
                </CWText>
              </div>
              <CWAvatarUsernameInput
                address={address}
                value={username}
                onAvatarChangeHandler={(a) => {
                  handleSetAvatar(a);
                }}
                onUsernameChangeHandler={(u) => {
                  handleSetUsername(u);
                }}
              />
              <CWButton label="Finish" onclick={saveProfileInfoCallback} />
            </div>
          )}
          {bodyType === 'ethWalletList' && (
            <div class="inner-body-container">
              <div class="header-container">
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
            <div class="inner-body-container">
              <div class="header-container">
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
                setProfiles={setProfiles}
                setSidebarType={setSidebarType}
                setSelectedWallet={setSelectedLinkingWallet}
                setBodyType={setBodyType}
                accountVerifiedCallback={accountVerifiedCallback}
                linking={true}
                showResetWalletConnect={showResetWalletConnect}
              />
            </div>
          )}
          {bodyType === 'selectProfile' && (
            <div class="inner-body-container">
              <div class="header-container">
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
              <CWButton label="Finish" onclick={performLinkingCallback} />
            </div>
          )}
          {bodyType === 'allSet' && (
            <div class="inner-body-container">
              <div class="header-container">
                <CWText
                  type="h3"
                  fontWeight="bold"
                  className="header-text"
                  isCentered
                >
                  You’re All Set!
                </CWText>
                <CWText type="h5" fontWeight="medium" isCentered>
                  You have sucessfully linked
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
  }
}
