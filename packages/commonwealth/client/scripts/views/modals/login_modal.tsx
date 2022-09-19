/* @jsx m */

import m from 'mithril';
import app from 'state';
import $ from 'jquery';

import _ from 'underscore';
import { initAppState } from 'app';
import {
  completeClientLogin,
  loginWithMagicLink,
  updateActiveAddresses,
} from 'controllers/app/login';

import { notifyError } from 'controllers/app/notifications';
import { Account, IWebWallet } from 'models';
import { ChainBase } from 'common-common/src/types';
import { isWindowMediumSmallInclusive } from '../components/component_kit/helpers';
import { ProfileRowAttrs } from '../components/component_kit/cw_profiles_list';
import { LoginDesktop } from '../pages/login/login_desktop';
import { LoginMobile } from '../pages/login/login_mobile';
import { LoginBodyType, LoginSidebarType } from '../pages/login/types';

type LoginModalAttrs = {
  initialBody?: LoginBodyType;
  initialSidebar?: LoginSidebarType;
  initialAccount?: Account;
  initialWallets?: IWebWallet<any>[];
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
  private selectedLinkingWallet: IWebWallet<any>;
  private cashedWalletSignature: string;
  private primaryAccount: Account;
  private secondaryLinkAccount: Account;
  private currentlyInCommunityPage: boolean;
  private magicLoading: boolean;

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
    if (vnode.attrs.initialWebWallet) {
      this.selectedWallet = vnode.attrs.initialWebWallet;
    }
    if (vnode.attrs.initialWallets) {
      this.wallets = vnode.attrs.initialWallets;
    }
  }

  view() {
    const handleEmailLoginCallback = async () => {
      this.magicLoading = true;
      if (!this.email) {
        notifyError('Please enter a valid email address.');
        this.magicLoading = false;
        return;
      }
      try {
        await loginWithMagicLink(this.email);
        this.magicLoading = false;
        $('.LoginDesktop').trigger('modalexit');
      } catch (e) {
        notifyError("Couldn't send magic link");
        this.magicLoading = false;
        console.error(e);
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
        completeClientLogin(account);
        if (exitOnComplete)
          if (isWindowMediumSmallInclusive(window.innerWidth)) {
            $('.LoginMobile').trigger('modalexit');
          } else {
            $('.LoginDesktop').trigger('modalexit');
          }

        m.redraw();
      } else {
        // log in as the new user
        await initAppState(false);
        if (app.chain) {
          const chain =
            app.user.selectedChain ||
            app.config.chains.getById(app.activeChainId());
          await updateActiveAddresses(chain);
        }
        if (exitOnComplete)
          if (isWindowMediumSmallInclusive(window.innerWidth)) {
            $('.LoginMobile').trigger('modalexit');
          } else {
            $('.LoginDesktop').trigger('modalexit');
          }
        m.redraw();
      }
    };

    const accountVerifiedCallback = async (
      account: Account,
      newlyCreated: boolean,
      linking: boolean
    ) => {
      // Handle Logged in and joining community of different chain base
      if (this.currentlyInCommunityPage && app.isLoggedIn()) {
        const signature = await this.selectedWallet.signWithAccount(account);
        await this.selectedWallet.validateWithAccount(account, signature);
        await logInWithAccount(account, true);
        return;
      }

      if (!linking) {
        this.primaryAccount = account;
        this.address = account.address;
        this.profiles = [account.profile];
      } else {
        if (newlyCreated) {
          notifyError("This account doesn't exist");
          return;
        }
        if (account.address === this.primaryAccount.address) {
          notifyError("You can't link to the same account");
          return;
        }
        this.secondaryLinkAccount = account;
        this.profiles = [account.profile]; // TODO: Update when User -> Many Profiles goes in
      }

      if (!newlyCreated && !linking) {
        try {
          const signature = await this.selectedWallet.signWithAccount(account);
          await this.selectedWallet.validateWithAccount(account, signature);
          await logInWithAccount(account, true);
        } catch (e) {
          console.log(e);
        }
      } else {
        if (!linking) {
          try {
            const signature = await this.selectedWallet.signWithAccount(
              account
            );
            this.cashedWalletSignature = signature;
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
        if (this.selectedWallet.chain !== 'near') {
          await this.selectedWallet.validateWithAccount(
            this.primaryAccount,
            this.cashedWalletSignature
          );
        }
        await logInWithAccount(this.primaryAccount, false);
      } catch (e) {
        console.log(e);
        notifyError('Failed to create account. Please try again.');
        if (isWindowMediumSmallInclusive(window.innerWidth)) {
          $('.LoginMobile').trigger('modalexit');
        } else {
          $('.LoginDesktop').trigger('modalexit');
        }
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
        const signature = await this.selectedLinkingWallet.signWithAccount(
          this.secondaryLinkAccount
        );
        await this.selectedLinkingWallet.validateWithAccount(
          this.secondaryLinkAccount,
          signature
        );
        await this.selectedWallet.validateWithAccount(
          this.primaryAccount,
          this.cashedWalletSignature
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
        await app.profiles.updateProfileForAccount(this.primaryAccount, data);
        if (isWindowMediumSmallInclusive(window.innerWidth)) {
          $('.LoginMobile').trigger('modalexit');
        } else {
          $('.LoginDesktop').trigger('modalexit');
        }
        m.redraw();
      } catch (e) {
        console.log(e);
        notifyError('Failed to save profile info');
        if (isWindowMediumSmallInclusive(window.innerWidth)) {
          $('.LoginMobile').trigger('modalexit');
        } else {
          $('.LoginDesktop').trigger('modalexit');
        }
      }
    };

    return isWindowMediumSmallInclusive(window.innerWidth) ? (
      <LoginMobile
        address={this.address}
        currentlyInCommunityPage={this.currentlyInCommunityPage}
        bodyType={this.bodyType}
        profiles={this.profiles}
        sidebarType={this.sidebarType}
        username={this.username}
        wallets={this.wallets}
        magicLoading={this.magicLoading}
        setAddress={(address: string) => {
          this.address = address;
        }}
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
        setProfiles={(profiles: Array<ProfileRowAttrs>) => {
          this.profiles = profiles;
        }}
        setSidebarType={(sidebarType: LoginSidebarType) => {
          this.sidebarType = sidebarType;
        }}
        setSelectedWallet={(wallet: IWebWallet<any>) => {
          this.selectedWallet = wallet;
        }}
        setSelectedLinkingWallet={(wallet: IWebWallet<any>) => {
          this.selectedLinkingWallet = wallet;
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
        currentlyInCommunityPage={this.currentlyInCommunityPage}
        bodyType={this.bodyType}
        profiles={this.profiles}
        sidebarType={this.sidebarType}
        username={this.username}
        wallets={this.wallets}
        magicLoading={this.magicLoading}
        setAddress={(address: string) => {
          this.address = address;
        }}
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
        setProfiles={(profiles: Array<ProfileRowAttrs>) => {
          this.profiles = profiles;
        }}
        setSidebarType={(sidebarType: LoginSidebarType) => {
          this.sidebarType = sidebarType;
        }}
        setSelectedWallet={(wallet: IWebWallet<any>) => {
          this.selectedWallet = wallet;
        }}
        setSelectedLinkingWallet={(wallet: IWebWallet<any>) => {
          this.selectedLinkingWallet = wallet;
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
