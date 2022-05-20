/* eslint-disable max-classes-per-file */
/* @jsx m */

import m from 'mithril';

import 'pages/login/login_components.scss';

import { modalRedirectClick } from 'helpers';
import { CWText } from '../../components/component_kit/cw_text';
import { CWWalletOptionRow } from '../../components/component_kit/cw_wallet_option_row';
import { CWAccountCreationButton } from '../../components/component_kit/cw_account_creation_button';
import { LoginSidebarType } from '../../modals/login_modal';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';

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
        {sidebarType === 'ethWallet' && (
          <div class="eth-wallet">
            <CWText type="h4" fontWeight="semiBold" className="header-text">
              This Community requires an Ethereum Wallet
            </CWText>
            <CWText type="b2">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut
              imperdiet velit fringilla lorem et. Integer accumsan lobortis
              cursus amet. Dictum sit morbi elementum.
            </CWText>
          </div>
        )}
        {sidebarType === 'newAddressLinked' && (
          <div class="connect-wallet">
            <div class="sidebar-content">
              <CWText type="h4" fontWeight="semiBold" className="header-text">
                New Address Linked
              </CWText>
              <CWText type="b2">
                By linking a new address, you are able to switch with ease and
                manage all of your communities, addresses and profiles under one
                account.
              </CWText>
              <CWText
                type="buttonSm"
                className="manage-link"
                onclick={() => {
                  // fill in
                }}
              >
                Manage Addresses
              </CWText>
            </div>
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

type WalletsListAttrs = {
  connectAnotherWayOnclick: () => void;
  hasNoWalletsLink?: boolean;
  wallets: Array<string>;
};

export class WalletsList implements m.ClassComponent<WalletsListAttrs> {
  view(vnode) {
    const {
      connectAnotherWayOnclick,
      hasNoWalletsLink = true,
      wallets,
    } = vnode.attrs;
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
          {hasNoWalletsLink && (
            <CWText type="caption" className="no-wallet-link">
              <a
                onclick={() => {
                  // link to where?
                }}
              >
                Don't see your wallet?
              </a>
            </CWText>
          )}
        </div>
        <CWText type="b2" className="connect-another-way-link">
          <a onclick={connectAnotherWayOnclick}>Connect Another Way</a>
        </CWText>
      </div>
    );
  }
}

export class LoginAddress implements m.ClassComponent<{ address: string }> {
  view(vnode) {
    const { address } = vnode.attrs;
    return (
      <div class="LoginAddress">
        <CWText type="caption">{address}</CWText>
      </div>
    );
  }
}

export type ProfileRowAttrs = {
  isSelected?: boolean;
  name: string;
  onclick?: () => void;
};

export class ProfileRow implements m.ClassComponent<ProfileRowAttrs> {
  view(vnode) {
    const { isSelected, onclick, name } = vnode.attrs;
    return (
      <div
        class={`profile-row${isSelected ? ' selected' : ''}`}
        onclick={onclick}
      >
        <div class="avatar-and-name">
          <div class="avatar" />
          <CWText type="b1" fontWeight="bold" noWrap>
            {name}
          </CWText>
        </div>
        {isSelected && <CWIcon iconName="check" />}
      </div>
    );
  }
}

export class ProfilesList
  implements
    m.ClassComponent<{ onclick: () => void; profiles: Array<ProfileRowAttrs> }>
{
  view(vnode) {
    const { onclick, profiles } = vnode.attrs;
    return (
      <div class="ProfilesList">
        <div class="profile-rows-container">
          {profiles.map((profile) => (
            <ProfileRow
              isSelected={profile.isSelected}
              name={profile.name}
              onclick={onclick}
            />
          ))}
        </div>
      </div>
    );
  }
}
