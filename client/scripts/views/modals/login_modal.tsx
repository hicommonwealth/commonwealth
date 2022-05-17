/* @jsx m */

import m from 'mithril';
import $ from 'jquery';

import 'modals/login_modal.scss';

import Login from 'views/components/login';
import { ModalExitButton } from '../components/component_kit/cw_modal';
import { CWText } from '../components/component_kit/cw_text';
import { CWWalletOptionRow } from '../components/component_kit/cw_wallet_option_row';

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

const redirectClick = (e, route) => {
  e.preventDefault();
  $(e.target).trigger('modalexit');
  m.route.set(route);
};

export class Boilerplate implements m.ClassComponent {
  view() {
    return (
      <CWText type="caption" className="Boilerplate">
        By connecting to Common, you agree to our{' '}
        <a
          class="link"
          onclick={(e) => {
            redirectClick(e, '/terms');
          }}
        >
          Terms of Service
        </a>{' '}
        and{' '}
        <a
          class="link"
          onclick={(e) => {
            redirectClick(e, '/privacy');
          }}
        >
          Privacy Policy
        </a>
      </CWText>
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
            <CWText type="b2">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut
              imperdiet velit fringilla lorem et. Integer accumsan lobortis
              cursus amet. Dictum sit morbi elementum.
            </CWText>
          </div>
        </div>
        <div class="body">
          <ModalExitButton />
          <Boilerplate />
          <div class="wallets-container">
            <div class="wallets">
              {wallets.map((w) => (
                <CWWalletOptionRow
                  walletName={w}
                  onclick={() => {
                    // link to where?
                  }}
                />
              ))}
            </div>
            <CWText type="caption" className="no-wallet-link">
              <a
                onclick={(e) => {
                  // link to where?
                }}
              >
                Don't see your wallet?
              </a>
            </CWText>
          </div>
          <CWText type="b2" className="connect-another-way-link">
            <a
              onclick={(e) => {
                // link to where?
              }}
            >
              Connect Another Way
            </a>
          </CWText>
        </div>
      </div>
    );
  }
}
