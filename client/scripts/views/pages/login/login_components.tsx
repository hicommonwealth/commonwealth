/* @jsx m */

import m from 'mithril';

import 'pages/login/login_components.scss';

import { modalRedirectClick } from 'helpers';
import { CWText } from '../../components/component_kit/cw_text';
import { CWWalletOptionRow } from '../../components/component_kit/cw_wallet_option_row';
import { CWAccountCreationButton } from '../../components/component_kit/cw_account_creation_button';
import { LoginSidebarType } from '../../modals/login_modal';

export class LoginSidebar
  implements m.ClassComponent<{ sidebarType: LoginSidebarType }>
{
  view(vnode) {
    const { sidebarType } = vnode.attrs;
    return (
      <div class="LoginSidebar">
        {sidebarType === 'connectWallet' && (
          <div class="connect-wallet">
            <div class="sidebar-content">
              <CWText type="h4" fontWeight="semiBold" className="header-text">
                Connect Your Wallet
              </CWText>
              <CWText type="b2">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut
                imperdiet velit fringilla lorem et. Integer accumsan lobortis
                cursus amet. Dictum sit morbi elementum.
              </CWText>
            </div>
          </div>
        )}
        {sidebarType === 'newOrReturning' && (
          <div class="new-or-returning">
            <CWText type="h4" fontWeight="semiBold" className="header-text">
              New or Returning?
            </CWText>
            <CWAccountCreationButton
              onclick={() => {
                // fill in
              }}
            />
            <CWAccountCreationButton
              creationType="linkAccount"
              onclick={() => {
                // fill in
              }}
            />
          </div>
        )}
      </div>
    );
  }
}

export class LoginBoilerplate implements m.ClassComponent {
  view() {
    return (
      <CWText type="caption" className="LoginBoilerplate">
        By connecting to Common, you agree to our{' '}
        <a
          class="link"
          onclick={(e) => {
            modalRedirectClick(e, '/terms');
          }}
        >
          Terms of Service
        </a>{' '}
        and{' '}
        <a
          class="link"
          onclick={(e) => {
            modalRedirectClick(e, '/privacy');
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

export class WalletsList implements m.ClassComponent {
  view() {
    return (
      <div class="WalletsList">
        <div class="wallets-and-link-container">
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
              onclick={() => {
                // link to where?
              }}
            >
              Don't see your wallet?
            </a>
          </CWText>
        </div>
        <CWText type="b2" className="connect-another-way-link">
          <a
            onclick={() => {
              // link to where?
            }}
          >
            Connect Another Way
          </a>
        </CWText>
      </div>
    );
  }
}
