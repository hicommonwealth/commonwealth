/* @jsx m */

import m from 'mithril';

import 'modals/login_modal.scss';

import Login from 'views/components/login';
import { CWButton } from '../components/component_kit/cw_button';
import { CWIcon } from '../components/component_kit/cw_icons/cw_icon';
import { ModalExitButton } from '../components/component_kit/cw_modal';
import { CWText } from '../components/component_kit/cw_text';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import {
  LoginAddress,
  LoginBoilerplate,
  LoginSidebar,
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

const wallets = [
  'cosm-metamask',
  'keplr',
  'metamask',
  'near',
  'polkadot',
  'terrastation',
  'walletconnect',
];

const profiles = [
  { name: 'Greenpeas.eth', isSelected: true },
  { name: 'Blue-Cow.eth' },
  { name: 'Averyveryveryveryveryverylongname' },
  { name: 'Another-Name.eth' },
];

export type LoginSidebarType =
  | 'connectWallet'
  | 'ethWallet'
  | 'newAddressLinked'
  | 'newOrReturning';

export type LoginBodyType =
  | 'allSet'
  | 'connectWithEmail'
  | 'ethWalletList'
  | 'newAddressLinked'
  | 'selectAccountType'
  | 'selectPrevious'
  | 'selectProfile'
  | 'walletList'
  | 'welcome';

export class NewLoginModal implements m.ClassComponent {
  private bodyType: LoginBodyType;
  private profiles: Array<ProfileRowAttrs>;
  private sidebarType: LoginSidebarType;
  private wallets: Array<string>;

  oninit() {
    this.bodyType = 'selectProfile';
    this.profiles = profiles;
    this.sidebarType = 'newAddressLinked';
    this.wallets = wallets;
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
                <CWButton label="Back" buttonType="secondary" />
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
              {/* username and avatar input here */}
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
                <LoginAddress address="bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq" />
                <CWText type="h5" fontWeight="medium">
                  to your Profile
                </CWText>
              </div>
              <ProfilesList profiles={this.profiles} />
              <CWButton label="Finish" />
            </div>
          )}
        </div>
      </div>
    );
  }
}
