/* @jsx m */

import m from 'mithril';

import 'pages/login/login_sidebar.scss';

import { CWText } from '../../components/component_kit/cw_text';
import { CWAccountCreationButton } from '../../components/component_kit/cw_account_creation_button';
import { LoginSidebarType } from '../../modals/login_modal';
import { CWButton } from '../../components/component_kit/cw_button';
import { LoginText } from './login_text';

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
              <LoginText
                bodyText={`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut
                imperdiet velit fringilla lorem et. Integer accumsan lobortis
                cursus amet. Dictum sit morbi elementum.`}
                headerText="Connect Your Wallet"
                isMobile={false}
              />
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
        {sidebarType === 'ethWallet' && (
          <div class="eth-wallet">
            <CWText type="h4" fontWeight="semiBold" className="header-text">
              This Community requires an Ethereum Wallet
            </CWText>
            <CWText type="b2" className="sidebar-body-text">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut
              imperdiet velit fringilla lorem et. Integer accumsan lobortis
              cursus amet. Dictum sit morbi elementum.
            </CWText>
          </div>
        )}
        {sidebarType === 'newAddressLinked' && (
          <div class="connect-wallet">
            <div class="sidebar-content">
              <LoginText
                bodyText={` By linking a new address, you are able to switch with ease and
                manage all of your communities, addresses and profiles under one
                account.`}
                headerText="New Address Linked"
                isMobile={false}
              />
              <CWButton
                buttonType="tertiary-blue"
                label="Manage Addresses"
                onclick={() => {
                  // fill in
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
}
