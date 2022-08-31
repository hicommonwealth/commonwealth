/* @jsx m */

import m from 'mithril';

import 'pages/login/login_desktop.scss';
import { loginWithMagicLink } from 'controllers/app/login';
import { Account } from 'models';

import { CWAddress } from '../../components/component_kit/cw_address';
import { CWAvatarUsernameInput } from '../../components/component_kit/cw_avatar_username_input';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { ModalExitButton } from '../../components/component_kit/cw_modal';

import {
  CWProfilesList,
  CWProfileRow,
} from '../../components/component_kit/cw_profiles_list';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWWalletsList } from '../../components/component_kit/cw_wallets_list';
import { LoginBoilerplate } from './login_boilerplate';
import { LoginDesktopSidebar } from './login_desktop_sidebar';

import { LoginAttrs } from './types';

export class LoginDesktop implements m.ClassComponent<LoginAttrs> {
  private email: string;
  private account: Account;
  view(vnode) {
    const {
      address,
      setAddress,
      bodyType,
      setBodyType,
      handleSetAvatar,
      handleSetUsername,
      profiles,
      setProfiles,
      sidebarType,
      setSidebarType,
      username,
      wallets,
      setWallets,
    } = vnode.attrs;

    const handleEmailLogin = async () => {
      console.log('email', this.email);
      if (!this.email) return;

      try {
        console.log('magic linkin');
        await loginWithMagicLink(this.email);
        // TODO: Understand the context of where we are coming from
        setBodyType('welcome');
      } catch (e) {
        console.error(e);
        // TODO: Error message display somehow
      }
    };

    return (
      <div class="LoginDesktop">
        <LoginDesktopSidebar sidebarType={sidebarType} />
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
                setProfiles={setProfiles}
                setAddress={setAddress}
                setSidebarType={setSidebarType}
                setBodyType={setBodyType}
                setAccount={(account) => {
                  this.account = account;
                }}
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
              <CWTextInput
                label="email address"
                placeholder="your-email@email.com"
                oninput={(e) => {
                  this.email = e.target.value;
                }}
              />
              <div class="buttons-row">
                <CWButton
                  label="Back"
                  buttonType="secondary-blue"
                  onclick={() => {
                    setBodyType('walletList');
                  }}
                />
                <CWButton label="Connect" onclick={handleEmailLogin} />
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
                  Use a generated username and photo to edit later, or edit now
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
              <CWButton label="Finish" />
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
                connectAnotherWayOnclick={() => {
                  // sidebarType = 'ethWallet';
                  // bodyType = 'connectWithEmail';
                }}
                hasNoWalletsLink={false}
                wallets={wallets}
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
                  // sidebarType = 'ethWallet';
                  // bodyType = 'connectWithEmail';
                }}
                hasNoWalletsLink={false}
                wallets={wallets}
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
              <CWButton label="Finish" />
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
