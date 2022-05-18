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
    this.sidebarType = 'connectWallet';
    this.bodyType = 'connectWithEmail';
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
                  this.sidebarType = 'ethWallet';
                  this.bodyType = 'connectWithEmail';
                }}
              />
            </div>
          )}
          {this.bodyType === 'selectAccountType' && (
            <div class="new-or-returning">
              <CWText type="h3" fontWeight="semiBold" className="address-text">
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
              <CWText type="h3" fontWeight="semiBold" className="address-text">
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
        </div>
      </div>
    );
  }
}
