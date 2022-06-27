/* @jsx m */

import m from 'mithril';

import 'modals/login_modal.scss';

import { WalletId } from 'types';
import Login from 'views/components/login';
import { CWButton } from '../components/component_kit/cw_button';
import { CWIcon } from '../components/component_kit/cw_icons/cw_icon';
import { ModalExitButton } from '../components/component_kit/cw_modal';
import { CWText } from '../components/component_kit/cw_text';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import {
  AvatarAndUsernameInput,
  LoginAddress,
  LoginBoilerplate,
  LoginSidebar,
  ProfileRow,
  ProfileRowAttrs,
  ProfilesList,
  WalletsList,
} from '../pages/login/login_components';

export class LoginModal implements m.ClassComponent {
  view() {
    return (
      <>
        <div class="compact-modal-title">
          <h3>Log in or create account</h3>
        </div>
        <div class="compact-modal-body">{m(Login)}</div>
      </>
    );
  }
}

const profiles = [
  { name: 'Greenpeas.eth', isSelected: true },
  { name: 'Blue-Cow.eth' },
  { name: 'Averyveryveryveryveryverylongname' },
  { name: 'Another-Name.eth' },
];

const dummyAddress = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';

export type LoginSidebarType =
  | 'connectWallet'
  | 'ethWallet'
  | 'newAddressLinked'
  | 'newOrReturning';

export type LoginBodyType =
  | 'allSet'
  | 'connectWithEmail'
  | 'ethWalletList'
  | 'selectAccountType'
  | 'selectPrevious'
  | 'selectProfile'
  | 'walletList'
  | 'welcome';

// TODO Gabe 6/22/22:
// 1. Pull in new headers when done
// 2. Dark mode styles where applicable
// 3. New PNG backgrounds where applicable
// 4. Vertical orientation for AvatarAndUsernameInput
// 5. New ethereum wallet alerts
// 6. All mobile

export class NewLoginModal implements m.ClassComponent {
  private avatarUrl: string;
  private bodyType: LoginBodyType;
  private profiles: Array<ProfileRowAttrs>;
  private sidebarType: LoginSidebarType;
  private username: string;
  private wallets: Array<string>;

  oninit() {
    this.avatarUrl = undefined;
    this.bodyType = 'welcome';
    this.profiles = profiles;
    this.sidebarType = 'newAddressLinked';
    this.username = 'elephant-blue.eth';
    this.wallets = Object.values(WalletId);
  }

  view() {
    return (
      <div class="NewLoginModal">
        <LoginSidebar sidebarType={this.sidebarType} />
        <div class="body">
          <ModalExitButton />
          {this.bodyType === 'walletList' && (
            <div class="inner-body-container centered">
              <LoginBoilerplate />
              <WalletsList
                connectAnotherWayOnclick={() => {
                  // this.sidebarType = 'ethWallet';
                  // this.bodyType = 'connectWithEmail';
                }}
                wallets={this.wallets}
              />
            </div>
          )}
          {this.bodyType === 'selectAccountType' && (
            <div class="inner-body-container centered">
              <div class="header-container">
                <CWText type="h3" fontWeight="semiBold" className="header-text">
                  Looks like this address hasn't been connected before.
                </CWText>
              </div>
              <div class="select-row">
                <CWIcon iconName="arrowLeft" />
                <CWText type="h5" fontWeight="semiBold" className="select-text">
                  Select Account Type
                </CWText>
              </div>
            </div>
          )}
          {this.bodyType === 'connectWithEmail' && (
            <div class="inner-body-container">
              <div class="header-container">
                <CWText type="h3" fontWeight="semiBold" className="header-text">
                  Connect With Email?
                </CWText>
                <LoginBoilerplate />
              </div>
              <CWTextInput
                label="email address"
                placeholder="your-email@email.com"
              />
              <div class="buttons-row">
                <CWButton label="Back" buttonType="secondary-blue" />
                <CWButton label="Connect" />
              </div>
            </div>
          )}
          {this.bodyType === 'welcome' && (
            <div class="inner-body-container">
              <div class="header-container">
                <CWText type="h3" fontWeight="bold" className="header-text">
                  Welcome to Common!
                </CWText>
                <CWText type="b2" className="subheader-text">
                  Use a generated username and photo to edit later, or edit now
                </CWText>
              </div>
              <AvatarAndUsernameInput
                address={dummyAddress}
                defaultValue={this.username}
                onAvatarChangeHandler={(a) => {
                  this.avatarUrl = a;
                }}
                onUsernameChangeHandler={(u) => {
                  this.username = u;
                }}
              />
              <CWButton label="Finish" />
            </div>
          )}
          {this.bodyType === 'ethWalletList' && (
            <div class="inner-body-container">
              <div class="header-container">
                <CWText type="h3" fontWeight="semiBold" className="header-text">
                  Select an Ethereum Wallet
                </CWText>
                <CWText type="caption" className="subheader-text">
                  Manage your profiles, addresses and communities under one
                  account.
                </CWText>
              </div>
              <WalletsList
                connectAnotherWayOnclick={() => {
                  // this.sidebarType = 'ethWallet';
                  // this.bodyType = 'connectWithEmail';
                }}
                hasNoWalletsLink={false}
                wallets={this.wallets}
              />
            </div>
          )}
          {this.bodyType === 'selectPrevious' && (
            <div class="inner-body-container">
              <div class="header-container">
                <CWText type="h3" fontWeight="semiBold" className="header-text">
                  Select a Previously Linked Address
                </CWText>
                <CWText type="caption" className="subheader-text">
                  Manage your profiles, addresses and communities under one
                  account.
                </CWText>
              </div>
              <WalletsList
                connectAnotherWayOnclick={() => {
                  // this.sidebarType = 'ethWallet';
                  // this.bodyType = 'connectWithEmail';
                }}
                hasNoWalletsLink={false}
                wallets={this.wallets}
              />
            </div>
          )}
          {this.bodyType === 'selectProfile' && (
            <div class="inner-body-container">
              <div class="header-container">
                <CWText type="h3" fontWeight="bold" className="header-text">
                  Select Profile
                </CWText>
                <CWText type="h5" fontWeight="medium">
                  Linking
                </CWText>
                <LoginAddress address={dummyAddress} />
                <CWText type="h5" fontWeight="medium">
                  to your Profile
                </CWText>
              </div>
              <ProfilesList profiles={this.profiles} />
              <CWButton label="Finish" />
            </div>
          )}
          {this.bodyType === 'allSet' && (
            <div class="inner-body-container">
              <div class="header-container">
                <CWText type="h3" fontWeight="bold" className="header-text">
                  You’re All Set!
                </CWText>
                <CWText type="h5" fontWeight="medium">
                  You have sucessfully linked
                </CWText>
                <LoginAddress address={dummyAddress} />
                <CWText type="h5" fontWeight="medium">
                  to your Profile
                </CWText>
              </div>
              <ProfileRow {...this.profiles[0]} />
              <CWButton label="Finish" />
            </div>
          )}
        </div>
      </div>
    );
  }
}
