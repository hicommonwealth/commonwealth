/* @jsx m */

import m from 'mithril';

import 'modals/login_modal.scss';

import Login from 'views/components/login';
import { ModalExitButton } from '../components/component_kit/cw_modal';
import { CWText } from '../components/component_kit/cw_text';

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

const wallets = {};

export class NewLoginModal implements m.ClassComponent {
  view() {
    return (
      <div class="NewLoginModal">
        <div class="sidebar">
          <div class="sidebar-content">
            <CWText type="h4" fontWeight="semiBold">
              Connect Your Wallet
            </CWText>
            <div class="divider" />
            <CWText type="b2" noWrap={false}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut
              imperdiet velit fringilla lorem et. Integer accumsan lobortis
              cursus amet. Dictum sit morbi elementum.
            </CWText>
          </div>
        </div>
        <div class="body">
          <ModalExitButton />
          <CWText type="caption" noWrap={false}>
            By connecting to Common, you agree to our{' '}
            <span class="link">Terms of Service</span> and{' '}
            <span class="link">Privacy Policy</span>
          </CWText>
        </div>
      </div>
    );
  }
}
