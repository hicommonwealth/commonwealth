/* @jsx m */

import ClassComponent from 'class_component';
import { ChainNetwork } from 'common-common/src/types';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import m from 'mithril';

import type { IWebWallet } from 'models';

import 'pages/login/login_desktop_sidebar.scss';
import app from 'state';
import { CWAccountCreationButton } from '../../components/component_kit/cw_account_creation_button';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWText } from '../../components/component_kit/cw_text';
import { LoginText } from './login_text';
import type { LoginSidebarType } from './types';

function generateText(wallets: Array<IWebWallet<any>>) {
  if (wallets.length === 0) {
    const chainbase = app.chain?.meta?.base;

    if (chainbase) {
      return `Please install a ${
        chainbase.charAt(0).toUpperCase() + chainbase.slice(1)
      } Wallet`;
    } else {
      return 'Please install a Web3 Wallet';
    }
  }
  const wallet = wallets[0];
  const startsWithVowel = wallet.chain === 'ethereum';
  const walletType =
    wallet.defaultNetwork === ChainNetwork.Terra
      ? `Terra Station`
      : wallet.chain.charAt(0).toUpperCase() + wallet.chain.slice(1);

  return `This Community requires a${
    startsWithVowel ? 'n' : ''
  } ${walletType} Wallet`;
}

type LoginDesktopSidebarAttrs = {
  sidebarType: LoginSidebarType;
  createNewAccountCallback: () => void;
  linkExistingAccountCallback: () => void;
  wallets: Array<IWebWallet<any>>;
};

export class LoginDesktopSidebar extends ClassComponent<LoginDesktopSidebarAttrs> {
  view(vnode: m.Vnode<LoginDesktopSidebarAttrs>) {
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
                headerText={
                  wallets.length > 0
                    ? 'Connect Your Wallet'
                    : 'Please Install a Wallet to Login'
                }
                bodyText={`Communities may require specific wallets for certain blockchains and tokens.
                Check requirements to ensure you have the necessary wallet and tokens to participate.`}
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
              {generateText(wallets)}
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
