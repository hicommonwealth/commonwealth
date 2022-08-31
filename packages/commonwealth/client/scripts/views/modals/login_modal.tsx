/* @jsx m */

import m from 'mithril';
import app from 'state';

import _ from 'underscore';

import { IWebWallet } from 'client/scripts/models';
import { ChainBase, WalletId } from 'common-common/src/types';
import Login from 'views/components/login';
import { isWindowMediumSmallInclusive } from '../components/component_kit/helpers';
import { ProfileRowAttrs } from '../components/component_kit/cw_profiles_list';
import { LoginDesktop } from '../pages/login/login_desktop';
import { LoginMobile } from '../pages/login/login_mobile';
import { LoginBodyType, LoginSidebarType } from '../pages/login/types';

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

const dummyAddress = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';

export class NewLoginModal implements m.ClassComponent {
  private avatarUrl: string;
  private address: string;
  private bodyType: LoginBodyType;
  private profiles: Array<ProfileRowAttrs>;
  private sidebarType: LoginSidebarType;
  private username: string;
  private wallets: Array<IWebWallet<any>>;

  oninit() {
    // Determine if in a community
    const currentlyInCommunityPage = app.activeChainId() !== undefined;

    if (currentlyInCommunityPage) {
      const chainbase = app.chain?.meta?.base;
      this.wallets = app.wallets.availableWallets(chainbase);

      this.sidebarType = 'ethWallet'; // TODO: This needs to be changed
      this.bodyType = 'walletList';
    } else {
      const allChains = app.config.chains.getAll();
      const sortedChainBases = [
        ChainBase.CosmosSDK,
        ChainBase.Ethereum,
        // ChainBase.NEAR,
        ChainBase.Substrate,
        ChainBase.Solana,
      ].filter((base) => allChains.find((chain) => chain.base === base));
      this.wallets = _.flatten(
        sortedChainBases.map((base) => {
          return app.wallets.availableWallets(base);
        })
      );
      this.sidebarType = 'connectWallet';
      this.bodyType = 'walletList';
    }
  }

  view() {
    return isWindowMediumSmallInclusive(window.innerWidth) ? (
      <LoginMobile
        address={dummyAddress}
        setAddress={(address: string) => {
          this.address = address;
        }}
        bodyType={this.bodyType}
        setBodyType={(bodyType: LoginBodyType) => {
          this.bodyType = bodyType;
        }}
        handleSetAvatar={(a) => {
          this.avatarUrl = a;
        }}
        handleSetUsername={(u) => {
          this.username = u;
        }}
        profiles={this.profiles}
        setProfiles={(profiles: Array<ProfileRowAttrs>) => {
          this.profiles = profiles;
        }}
        sidebarType={this.sidebarType}
        setSidebarType={(sidebarType: LoginSidebarType) => {
          this.sidebarType = sidebarType;
        }}
        username={this.username}
        wallets={this.wallets}
        setWallets={(wallets: Array<IWebWallet<any>>) => {
          this.wallets = wallets;
        }}
      />
    ) : (
      <LoginDesktop
        address={dummyAddress}
        setAddress={(address: string) => {
          this.address = address;
        }}
        bodyType={this.bodyType}
        setBodyType={(bodyType: LoginBodyType) => {
          this.bodyType = bodyType;
        }}
        handleSetAvatar={(a) => {
          this.avatarUrl = a;
        }}
        handleSetUsername={(u) => {
          this.username = u;
        }}
        profiles={this.profiles}
        setProfiles={(profiles: Array<ProfileRowAttrs>) => {
          this.profiles = profiles;
        }}
        sidebarType={this.sidebarType}
        setSidebarType={(sidebarType: LoginSidebarType) => {
          this.sidebarType = sidebarType;
        }}
        username={this.username}
        wallets={this.wallets}
        setWallets={(wallets: Array<IWebWallet<any>>) => {
          this.wallets = wallets;
        }}
      />
    );
  }
}
