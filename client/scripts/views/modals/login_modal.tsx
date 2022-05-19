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
  LoginBoilerplate,
  LoginSidebar,
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
  | 'walletList'
  | 'welcome'
  | 'welcomeBack';

export class NewLoginModal implements m.ClassComponent {
  private sidebarType: LoginSidebarType;
  private bodyType: LoginBodyType;

  oninit() {
    this.sidebarType = 'newOrReturning';
    this.bodyType = 'walletList';
  }

  view() {
    return (
      <div class="NewLoginModal">
        <LoginSidebar sidebarType={this.sidebarType} />
        <div class="body">
          <ModalExitButton />
          {this.bodyType === 'walletList' && (
            <div class="wallet-list">
              <LoginBoilerplate />
              <WalletsList
                connectAnotherWayOnclick={() => {
                  // this.sidebarType = 'ethWallet';
                  // this.bodyType = 'connectWithEmail';
                }}
              />
            </div>
          )}
          {this.bodyType === 'selectAccountType' && (
            <div class="new-or-returning">
              <CWText type="h3" fontWeight="semiBold" className="header-text">
                Looks like this address hasn't been connected before.
              </CWText>
              <div class="select-row">
                <CWIcon iconName="arrowLeft" />
                <CWText type="h5" fontWeight="semiBold" className="select-text">
                  Select Account Type
                </CWText>
              </div>
            </div>
          )}
          {this.bodyType === 'connectWithEmail' && (
            <div class="connect-with-email">
              <CWText type="h3" fontWeight="semiBold" className="header-text">
                Connect With Email?
              </CWText>
              <LoginBoilerplate />
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
            <div class="welcome">
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
            <div class="wallet-list">
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
            <div class="wallet-list">
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
        </div>
      </div>
    );
  }
}
