/* @jsx m */

import m from 'mithril';

import 'modals/login_modal.scss';

import Login from 'views/components/login';
import { CWIcon } from '../components/component_kit/cw_icons/cw_icon';
import { ModalExitButton } from '../components/component_kit/cw_modal';
import { CWText } from '../components/component_kit/cw_text';
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

const type: LoginSidebarType = 'newOrReturning';

export class NewLoginModal implements m.ClassComponent {
  view() {
    return (
      <div class="NewLoginModal">
        <LoginSidebar sidebarType={type} />
        <div class="body">
          <ModalExitButton />
          {type === 'connectWallet' && (
            <>
              <LoginBoilerplate />
              <WalletsList />
            </>
          )}
          {type === 'newOrReturning' && (
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
        </div>
      </div>
    );
  }
}
