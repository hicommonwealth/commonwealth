/* @jsx m */

import m from 'mithril';

import 'pages/login/login_desktop_sidebar.scss';

import { IWebWallet } from 'models';
import { CWText } from '../../components/component_kit/cw_text';
import { CWAccountCreationButton } from '../../components/component_kit/cw_account_creation_button';
import { CWButton } from '../../components/component_kit/cw_button';
import { LoginText } from './login_text';
import { LoginSidebarType } from './types';

function generateText(wallet: IWebWallet<any>) {
  const startsWithVowel = wallet.chain === 'ethereum';

  return `This Community requires a${startsWithVowel ? 'n' : ''} ${
    wallet.chain.charAt(0).toUpperCase() + wallet.chain.slice(1)
  } Wallet`;
}

export class LoginDesktopSidebar
  implements
    m.ClassComponent<{
      sidebarType: LoginSidebarType;
      createNewAccountCallback: () => void;
      linkExistingAccountCallback: () => void;
      wallets: Array<IWebWallet<any>>;
    }>
{
  view(vnode) {
    const {
      sidebarType,
      createNewAccountCallback,
      linkExistingAccountCallback,
      wallets,
    } = vnode.attrs;
    return (
      <div class="LoginDesktopSidebar">
        {sidebarType === 'connectWallet' && (
          <div class="connect-wallet">
            <div class="sidebar-content">
              <LoginText
                headerText="Connect Your Wallet"
                bodyText={`Many communities require different wallets 
                            based on the chain they are built on and 
                            the types of tokens members hold.`}
              />
            </div>
          </div>
        )}
        {sidebarType === 'newOrReturning' && (
          <div class="new-or-returning">
            <CWText type="h4" fontWeight="semiBold" className="header-text">
              New or Returning?
            </CWText>
            <CWAccountCreationButton onclick={createNewAccountCallback} />
            <CWAccountCreationButton
              creationType="linkAccount"
              onclick={linkExistingAccountCallback}
            />
          </div>
        )}
        {sidebarType === 'communityWalletOptions' && (
          <div class="eth-wallet">
            <CWText type="h4" fontWeight="semiBold" className="header-text">
              {generateText(wallets[0])}
            </CWText>
            <CWText type="b2" className="sidebar-body-text">
              Many communities require different wallets based on the chain they
              are built on and the types of tokens members hold.
            </CWText>
          </div>
        )}
        {sidebarType === 'newAddressLinked' && (
          <div class="connect-wallet">
            <div class="sidebar-content">
              <LoginText
                headerText="New Address Linked"
                bodyText={` By linking a new address, you are able to switch with ease and
                manage all of your communities, addresses and profiles under one
                account.`}
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
