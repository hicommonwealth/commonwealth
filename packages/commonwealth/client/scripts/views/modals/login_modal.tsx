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

import { notifyError } from 'controllers/app/notifications';
import { Account, AddressInfo, IWebWallet, Profile } from 'models';
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

type LoginModalAttrs = {
  initialBody?: LoginBodyType;
  initialSidebar?: LoginSidebarType;
  initialAccount?: Account;
};

export class NewLoginModal implements m.ClassComponent<LoginModalAttrs> {
  private avatarUrl: string;
  private address: string;
  private bodyType: LoginBodyType;
  private profiles: Array<ProfileRowAttrs>;
  private sidebarType: LoginSidebarType;
  private username: string;
  private email: string;
  private wallets: Array<IWebWallet<any>>;
  private selectedWallet: IWebWallet<any>;
  private loggedInProfile: Profile;
  private primaryAccount: Account;
  private secondaryLinkAccount: Account;
  private currentlyInCommunityPage: boolean;

  oninit(vnode) {
    // Determine if in a community
    this.currentlyInCommunityPage = app.activeChainId() !== undefined;

    if (this.currentlyInCommunityPage) {
      const chainbase = app.chain?.meta?.base;
      this.wallets = app.wallets.availableWallets(chainbase);
      this.sidebarType = 'communityWalletOptions';
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

    // Override if initial data is provided (needed for redirecting wallets)
    if (vnode.attrs.initialBody) {
      this.bodyType = vnode.attrs.initialBody;
    }
    if (vnode.attrs.initialSidebar) {
      this.sidebarType = vnode.attrs.initialSidebar;
    }
    if (vnode.attrs.initialAccount) {
      this.primaryAccount = vnode.attrs.initialAccount;
      this.address = vnode.attrs.initialAccount.address;
    }
  }

  view() {
    const handleEmailLoginCallback = async () => {
      console.log('helloo', this.email);
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

    const logInWithAccount = async (
      account: Account,
      exitOnComplete: boolean
    ) => {
      const profile = account.profile;
      this.address = account.address;
      if (profile.name) {
        this.username = profile.name;
      }
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

        if (exitOnComplete) $('.LoginDesktop').trigger('modalexit');
        m.redraw();
      } else {
        // log in as the new user
        await initAppState(false);

        // load addresses for the current chain/community
        if (app.chain) {
          // TODO: this breaks when the user action creates a new token forum
          const chain =
            app.user.selectedChain ||
            app.config.chains.getById(app.activeChainId());
          await updateActiveAddresses(chain);
        }
        if (exitOnComplete) $('.LoginDesktop').trigger('modalexit');
        m.redraw();
      }
    };

    const accountVerifiedCallback = async (
      account: Account,
      newlyCreated: boolean,
      linking: boolean
    ) => {
      if (!linking) {
        this.primaryAccount = account;
        this.address = account.address;
        this.loggedInProfile = account.profile;
        this.profiles = [account.profile];
      } else {
        if (newlyCreated) {
          notifyError("This account doesn't exist");
          return;
        }
        this.secondaryLinkAccount = account;
        this.loggedInProfile = account.profile;
        // TODO: Should get all profiles associated with the secondaryLinkAccount's User- not merged yet??
        this.profiles = [account.profile];
      }

      if (!newlyCreated && !linking) {
        try {
          await this.selectedWallet.validateWithAccount(account, true);
          await logInWithAccount(account, true);
        } catch (e) {
          console.log(e);
        }
      } else {
        if (!linking) {
          try {
            await this.selectedWallet.validateWithAccount(account, true);
          } catch (e) {
            console.log(e);
          }
          this.sidebarType = 'newOrReturning';
          this.bodyType = 'selectAccountType';
        } else {
          this.sidebarType = 'newAddressLinked';
          this.bodyType = 'selectProfile';
        }

        m.redraw();
      }
    };

    const createNewAccountCallback = async () => {
      try {
        //  await this.selectedWallet.validateWithAccount(this.primaryAccount);
        await logInWithAccount(this.primaryAccount, false);
      } catch (e) {
        console.log(e);
      }
      this.bodyType = 'welcome';
      m.redraw();
    };

    const linkExistingAccountCallback = async () => {
      this.bodyType = 'selectPrevious';
      m.redraw();
    };

    const performLinkingCallback = async () => {
      try {
        // Profile is already set correctly
        // Add primary linked account to this profile

        console.log('primary Profile', this.primaryAccount.profile);
        console.log('secondary Profile', this.secondaryLinkAccount.profile);
        await this.selectedWallet.validateWithAccount(
          this.secondaryLinkAccount,
          false
        );

        await this.primaryAccount.updateProfile(
          this.secondaryLinkAccount.address
        );

        await logInWithAccount(this.primaryAccount, true);
      } catch (e) {
        console.log(e);
        notifyError('Unable to link account');
      }
    };

    const saveProfileInfoCallback = async () => {
      const data = {
        name: this.username,
        avatar_url: this.avatarUrl,
      };
      try {
        // TODO: Add in new updateProfile route (dexters PR)

        // await app.profiles.updateProfileForAccount(
        //   app.user.activeAccount,
        //   data
        // );

        // Close Modal
        $('.LoginDesktop').trigger('modalexit');
        m.redraw();
      } catch (e) {
        console.log(e);
        notifyError('Failed to save profile info');
      }
    };

    return isWindowMediumSmallInclusive(window.innerWidth) ? (
      <LoginMobile
        address={this.address}
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
        handleSetEmail={(e) => {
          this.email = e.target.value;
        }}
        sidebarType={this.sidebarType}
        setSidebarType={(sidebarType: LoginSidebarType) => {
          this.sidebarType = sidebarType;
        }}
        username={this.username}
        wallets={this.wallets}
        setSelectedWallet={(wallet: IWebWallet<any>) => {
          this.selectedWallet = wallet;
        }}
        createNewAccountCallback={createNewAccountCallback}
        linkExistingAccountCallback={linkExistingAccountCallback}
        accountVerifiedCallback={accountVerifiedCallback}
        handleEmailLoginCallback={handleEmailLoginCallback}
        saveProfileInfoCallback={saveProfileInfoCallback}
        performLinkingCallback={performLinkingCallback}
      />
    ) : (
      <LoginDesktop
        address={this.address}
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
        handleSetEmail={(e) => {
          this.email = e.target.value;
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
        setSelectedWallet={(wallet: IWebWallet<any>) => {
          this.selectedWallet = wallet;
        }}
        createNewAccountCallback={createNewAccountCallback}
        linkExistingAccountCallback={linkExistingAccountCallback}
        accountVerifiedCallback={accountVerifiedCallback}
        handleEmailLoginCallback={handleEmailLoginCallback}
        saveProfileInfoCallback={saveProfileInfoCallback}
        performLinkingCallback={performLinkingCallback}
      />
    );
  }
}
