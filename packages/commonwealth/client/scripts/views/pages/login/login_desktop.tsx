/* @jsx m */

import m from 'mithril';
import app from 'state';
import $ from 'jquery';

import 'pages/login/login_desktop.scss';
import {
  loginWithMagicLink,
  setActiveAccount,
  updateActiveAddresses,
} from 'controllers/app/login';
import { Account, AddressInfo } from 'models';
import { isSameAccount } from 'helpers';
import { initAppState } from 'app';
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

    const accountVerifiedCallback = async (account: Account) => {
      if (app.isLoggedIn()) {
        // existing user

        // initialize role
        try {
          // initialize AddressInfo
          // TODO: refactor so addressId is always stored on Account and we can avoid this
          //
          // Note: account.addressId is set by all createAccount
          // methods in controllers/login.ts. this means that all
          // cases should be covered (either the account comes from
          // the backend and the address is also loaded via
          // AddressInfo, or the account is created on the frontend
          // and the id is available here).
          let addressInfo = app.user.addresses.find(
            (a) =>
              a.address === account.address && a.chain.id === account.chain.id
          );

          if (!addressInfo && account.addressId) {
            // TODO: add keytype
            addressInfo = new AddressInfo(
              account.addressId,
              account.address,
              account.chain.id,
              account.walletId
            );
            app.user.addresses.push(addressInfo);
          }

          // link the address to the community
          if (app.chain) {
            try {
              if (
                !app.roles.getRoleInCommunity({
                  account,
                  chain: vnode.attrs.joiningChain,
                })
              ) {
                await app.roles.createRole({
                  address: addressInfo,
                  chain: vnode.attrs.joiningChain,
                });
              }
            } catch (e) {
              // this may fail if the role already exists, e.g. if the address is being migrated from another user
              console.error('Failed to create role');
            }
          }

          // set the address as active
          await setActiveAccount(account);
          if (
            app.user.activeAccounts.filter((a) => isSameAccount(a, account))
              .length === 0
          ) {
            app.user.setActiveAccounts(
              app.user.activeAccounts.concat([account])
            );
          }
        } catch (e) {
          console.trace(e);
          // if the address' role wasn't initialized correctly,
          // setActiveAccount will throw an exception but we should continue
        }

        $('.LoginDesktop').trigger('modalexit');
        m.redraw();
      } else {
        // log in as the new user
        await initAppState(false);
        // load addresses for the current chain/community
        if (app.chain) {
          // TODO: this breaks when the user action creates a new token forum
          const chain =
            app.user.selectedChain ||
            app.config.chains.getById(app.activeChainId());
          await updateActiveAddresses(chain);
        }
        $('.LoginDesktop').trigger('modalexit');
        m.redraw();
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
                setAccount={(account: Account) => {
                  this.account = account;
                }}
                accountVerifiedCallback={accountVerifiedCallback}
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
