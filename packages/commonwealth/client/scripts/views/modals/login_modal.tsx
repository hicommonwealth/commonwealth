/* @jsx m */

import m from 'mithril';
import app from 'state';
import $ from 'jquery';

import _ from 'underscore';
import { initAppState } from 'app';
import {
  loginWithMagicLink,
  setActiveAccount,
  updateActiveAddresses,
} from 'controllers/app/login';
import { isSameAccount } from 'helpers';

import { Account, AddressInfo, IWebWallet } from 'models';
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
  private email: string;
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
    const handleEmailLoginCallback = async () => {
      if (!this.email) return;

      try {
        console.log('magic linkin');
        await loginWithMagicLink(this.email);
        // TODO: Understand the context of where we are coming from
        this.bodyType = 'welcome';
      } catch (e) {
        console.error(e);
        // TODO: Error message display somehow
      }
    };

    const logInWithAccount = async (account: Account) => {
      if (app.isLoggedIn()) {
        // Already logged in with another account
        try {
          let addressInfo = app.user.addresses.find(
            (a) =>
              a.address === account.address && a.chain.id === account.chain.id
          );

          if (!addressInfo && account.addressId) {
            // TODO: add keytype
            addressInfo = new AddressInfo(
              account.addressId,
              account.address,
              account.chain.id,
              account.walletId
            );
            app.user.addresses.push(addressInfo);
          }

          // link the address to the community
          if (app.chain) {
            try {
              if (
                !app.roles.getRoleInCommunity({
                  account,
                  chain: app.activeChainId(),
                })
              ) {
                await app.roles.createRole({
                  address: addressInfo,
                  chain: app.activeChainId(),
                });
              }
            } catch (e) {
              // this may fail if the role already exists, e.g. if the address is being migrated from another user
              console.error('Failed to create role');
            }
          }

          // set the address as active
          await setActiveAccount(account);
          if (
            app.user.activeAccounts.filter((a) => isSameAccount(a, account))
              .length === 0
          ) {
            app.user.setActiveAccounts(
              app.user.activeAccounts.concat([account])
            );
          }
        } catch (e) {
          console.trace(e);
          // if the address' role wasn't initialized correctly,
          // setActiveAccount will throw an exception but we should continue
        }

        $('.LoginDesktop').trigger('modalexit');
        m.redraw();
      } else {
        // log in as the new user
        console.log('new user');

        await initAppState(false);
        // load addresses for the current chain/community
        if (app.chain) {
          // TODO: this breaks when the user action creates a new token forum
          const chain =
            app.user.selectedChain ||
            app.config.chains.getById(app.activeChainId());
          await updateActiveAddresses(chain);
        }
        $('.LoginDesktop').trigger('modalexit');
        m.redraw();
      }
    };

    const accountVerifiedCallback = async (
      account: Account,
      newlyCreated: boolean
    ) => {
      if (!newlyCreated) {
        await logInWithAccount(account);
      } else {
        this.sidebarType = 'newOrReturning';
        this.bodyType = 'selectAccountType';
        m.redraw();
      }
    };

    const createNewAccountCallback = async () => {
      this.bodyType = 'welcome';
      m.redraw();
    };

    const linkExistingAccountCallback = async () => {
      this.bodyType = 'selectPrevious';
      m.redraw();
    };

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
        createNewAccountCallback={createNewAccountCallback}
        linkExistingAccountCallback={linkExistingAccountCallback}
        accountVerifiedCallback={accountVerifiedCallback}
        handleEmailLoginCallback={handleEmailLoginCallback}
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
        createNewAccountCallback={createNewAccountCallback}
        linkExistingAccountCallback={linkExistingAccountCallback}
        accountVerifiedCallback={accountVerifiedCallback}
        handleEmailLoginCallback={handleEmailLoginCallback}
      />
    );
  }
}
