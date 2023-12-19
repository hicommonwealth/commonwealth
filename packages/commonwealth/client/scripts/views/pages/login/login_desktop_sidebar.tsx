import { ChainBase, ChainNetwork } from '@hicommonwealth/core';
import 'pages/login/login_desktop_sidebar.scss';
import React from 'react';
import app from 'state';
import { CWAccountCreationButton } from 'views/components/component_kit/cw_account_creation_button';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWText } from 'views/components/component_kit/cw_text';
import type IWebWallet from '../../../models/IWebWallet';
import { LoginText } from './login_text';
import type { LoginSidebarType } from './types';

const generateText = (wallets: Array<IWebWallet<any>>) => {
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
  const startsWithVowel = wallet.chain === ChainBase.Ethereum;
  const walletType =
    wallet.defaultNetwork === ChainNetwork.Terra
      ? `Station`
      : wallet.chain.charAt(0).toUpperCase() + wallet.chain.slice(1);

  return `This Community requires a${
    startsWithVowel ? 'n' : ''
  } ${walletType} Wallet`;
};

type LoginDesktopSidebarProps = {
  sidebarType: LoginSidebarType;
  onCreateNewAccount: () => void;
  onLinkExistingAccount: () => void;
  wallets: Array<IWebWallet<any>>;
};

export const LoginDesktopSidebar = ({
  sidebarType,
  onCreateNewAccount,
  onLinkExistingAccount,
  wallets,
}: LoginDesktopSidebarProps) => {
  return (
    <div className="LoginDesktopSidebar">
      {sidebarType === 'connectWallet' && (
        <div className="connect-wallet">
          <div className="sidebar-content">
            <LoginText
              headerText={
                wallets.length > 0
                  ? 'Sign in to Commonwealth'
                  : 'Please Install a Wallet to sign in'
              }
              bodyText="Many communities require different wallets based
            on the chain they are built on and the types of tokens members hold."
            />
          </div>
        </div>
      )}

      {sidebarType === 'createCommunityLogin' && (
        <div className="connect-wallet">
          <div className="sidebar-content">
            <LoginText
              headerText={
                wallets.length > 0
                  ? 'Sign in to create your community'
                  : 'Please Install a Wallet to sign in'
              }
              bodyText="To launch your community choose a sign-in option
              that is compatible with the ecosystem you selected."
            />
          </div>
        </div>
      )}

      {sidebarType === 'emailLogin' && (
        <div className="connect-wallet">
          <div className="sidebar-content">
            <LoginText
              headerText="Enter your email"
              bodyText="Follow the instructions provided to sign in to Commonwealth with your email."
            />
          </div>
        </div>
      )}

      {sidebarType === 'newOrReturning' && (
        <div className="new-or-returning">
          <CWText type="h4" fontWeight="semiBold" className="header-text">
            New or Returning?
          </CWText>
          <CWAccountCreationButton onClick={onCreateNewAccount} />
          <CWAccountCreationButton
            creationType="linkAccount"
            onClick={onLinkExistingAccount}
          />
        </div>
      )}

      {sidebarType === 'communityWalletOptions' && (
        <div className="eth-wallet">
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
        <div className="connect-wallet">
          <div className="sidebar-content">
            <LoginText
              headerText="New Address Linked"
              bodyText="By linking a new address, you are able to switch with ease and
                manage all of your communities, addresses and profiles under one
                account."
            />
            <CWButton buttonType="tertiary-blue" label="Manage Addresses" />
          </div>
        </div>
      )}
    </div>
  );
};
