import React from 'react';

import _ from 'lodash';
import app, { initAppState } from 'state';
import { ChainBase } from 'common-common/src/types';
import { ClassComponent } from 'mithrilInterop';
import type { ResultNode } from 'mithrilInterop';

import {
  completeClientLogin,
  loginWithMagicLink,
  updateActiveAddresses,
} from 'controllers/app/login';
import TerraWalletConnectWebWalletController from 'controllers/app/webWallets/terra_walletconnect_web_wallet';
import WalletConnectWebWalletController from 'controllers/app/webWallets/walletconnect_web_wallet';
import { signSessionWithAccount } from 'controllers/server/sessions';

import { notifyError } from 'controllers/app/notifications';
import WebWalletController from '../../controllers/app/web_wallets';
import Account from '../../models/Account';
import IWebWallet from '../../models/IWebWallet';

import {
  breakpointFnValidator,
  isWindowMediumSmallInclusive,
} from '../components/component_kit/helpers';
import type { ProfileRowProps } from '../components/component_kit/cw_profiles_list';
import { LoginDesktop } from '../pages/login/login_desktop';
import { LoginMobile } from '../pages/login/login_mobile';
import type { LoginBodyType, LoginSidebarType } from '../pages/login/types';
import { setDarkMode } from '../../helpers/darkMode';

type LoginModalAttrs = {
  initialBody?: LoginBodyType;
  initialSidebar?: LoginSidebarType;
  initialAccount?: Account;
  initialWallets?: IWebWallet<any>[];
  onSuccess?: () => void;
  onModalClose: () => void;
};

export class LoginModal extends ClassComponent<LoginModalAttrs> {
  private avatarUrl: string;
  private address: string;
  private bodyType: LoginBodyType;
  private profiles: Array<ProfileRowProps>;
  private sidebarType: LoginSidebarType;
  private username: string;
  private email: string;
  private wallets: Array<IWebWallet<any>>;
  private selectedWallet: IWebWallet<any>;
  private selectedLinkingWallet: IWebWallet<any>;
  private cachedWalletSignature: string;
  private cachedTimestamp: number;
  private cachedChainId: string | number;
  private primaryAccount: Account;
  private secondaryLinkAccount: Account;
  private secondaryChainId: string | number;
  private currentlyInCommunityPage: boolean;
  private magicLoading: boolean;
  private showMobile: boolean;

  oncreate(vnode: ResultNode<LoginModalAttrs>) {
    // Determine if in a community
    this.currentlyInCommunityPage = app.activeChainId() !== undefined;

    if (this.currentlyInCommunityPage) {
      const chainbase = app.chain?.meta?.base;
      this.wallets = WebWalletController.Instance.availableWallets(chainbase);
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
          return WebWalletController.Instance.availableWallets(base);
        })
      );
      this.sidebarType = 'connectWallet';
      this.bodyType = 'walletList';
    }

    this.showMobile = isWindowMediumSmallInclusive(window.innerWidth);

    // Override if initial data is provided (needed for redirecting wallets + CommonBot)
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
    // if (vnode.attrs.initialWebWallet) {
    //   this.selectedWallet = vnode.attrs.initialWebWallet;
    // }
    if (vnode.attrs.initialWallets) {
      this.wallets = vnode.attrs.initialWallets;
    }

    // eslint-disable-next-line no-restricted-globals
    addEventListener('resize', () =>
      breakpointFnValidator(
        this.showMobile,
        (state: boolean) => {
          this.showMobile = state;
        },
        isWindowMediumSmallInclusive
      )
    );
  }

  onremove() {
    // eslint-disable-next-line no-restricted-globals
    removeEventListener('resize', () =>
      breakpointFnValidator(
        this.showMobile,
        (state: boolean) => {
          this.showMobile = state;
        },
        isWindowMediumSmallInclusive
      )
    );
  }

  view(vnode: ResultNode<LoginModalAttrs>) {
    const { onSuccess } = vnode.attrs;
    const wcEnabled = _.some(
      this.wallets,
      (w) =>
        (w instanceof WalletConnectWebWalletController ||
          w instanceof TerraWalletConnectWebWalletController) &&
        w.enabled
    );

    // Handles Magic Link Login
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
        if (onSuccess) onSuccess();
        if (isWindowMediumSmallInclusive(window.innerWidth)) {
          vnode.attrs.onModalClose();
        } else {
          vnode.attrs.onModalClose();
        }
      } catch (e) {
        notifyError("Couldn't send magic link");
        this.magicLoading = false;
        console.error(e);
      }
    };

    // Performs Login on the client
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
        completeClientLogin(account);
        if (exitOnComplete) {
          if (isWindowMediumSmallInclusive(window.innerWidth)) {
            vnode.attrs.onModalClose();
          } else {
            vnode.attrs.onModalClose();
          }
          if (onSuccess) onSuccess();
        }
      } else {
        // log in as the new user
        await initAppState(false);
        if (localStorage.getItem('user-dark-mode-state') === 'on') {
          setDarkMode(true);
        }
        if (app.chain) {
          const chain =
            app.user.selectedChain ||
            app.config.chains.getById(app.activeChainId());
          await updateActiveAddresses(chain);
        }
        if (exitOnComplete) {
          if (isWindowMediumSmallInclusive(window.innerWidth)) {
            vnode.attrs.onModalClose();
          } else {
            vnode.attrs.onModalClose();
          }
          if (onSuccess) onSuccess();
        }
      }
    };

    // Handle branching logic after wallet is selected
    const accountVerifiedCallback = async (
      account: Account,
      newlyCreated: boolean,
      linking: boolean
    ) => {
      // Handle Logged in and joining community of different chain base
      if (this.currentlyInCommunityPage && app.isLoggedIn()) {
        const timestamp = +new Date();
        const { signature, chainId, sessionPayload } =
          await signSessionWithAccount(this.selectedWallet, account, timestamp);
        await account.validate(signature, timestamp, chainId);
        await app.sessions.authSession(
          app.chain.base,
          chainId,
          account.address,
          sessionPayload,
          signature
        );
        await logInWithAccount(account, true);
        return;
      }

      // Handle Linking vs New Account cases
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

      // Handle receiving and caching wallet signature strings
      if (!newlyCreated && !linking) {
        try {
          const timestamp = +new Date();
          const { signature, sessionPayload, chainId } =
            await signSessionWithAccount(
              this.selectedWallet,
              account,
              timestamp
            );
          await account.validate(signature, timestamp, chainId);
          await app.sessions.authSession(
            app.chain ? app.chain.base : this.selectedWallet.chain,
            chainId,
            account.address,
            sessionPayload,
            signature
          );
          await logInWithAccount(account, true);
        } catch (e) {
          console.log(e);
        }
      } else {
        if (!linking) {
          try {
            const timestamp = +new Date();
            const { signature, sessionPayload, chainId } = await signSessionWithAccount(
              this.selectedWallet,
              account,
              timestamp
            );
            app.sessions.authSession(
              app.chain ? app.chain.base : this.selectedWallet.chain,
              chainId,
              account.address,
              sessionPayload,
              signature
            );
            this.cachedWalletSignature = signature;
            this.cachedTimestamp = timestamp;
            this.cachedChainId = chainId;
            this.cachedChainId = this.selectedWallet.getChainId();
            onSuccess?.();
          } catch (e) {
            console.log(e);
          }
          this.sidebarType = 'newOrReturning';
          this.bodyType = 'selectAccountType';
        } else {
          this.sidebarType = 'newAddressLinked';
          this.bodyType = 'selectProfile';
        }
      }
    };

    // Handle Logic for creating a new account, including validating signature
    const createNewAccountCallback = async () => {
      try {
        if (this.selectedWallet.chain !== 'near') {
          await this.primaryAccount.validate(
            this.cachedWalletSignature,
            this.cachedTimestamp,
            this.cachedChainId
          );
        }
        await logInWithAccount(this.primaryAccount, false);
        // Important: when we first create an account and verify it, the user id
        // is initially null from api (reloading the page will update it), to correct
        // it we need to get the id from api
        await app.newProfiles.updateProfileForAccount(
          this.primaryAccount.profile.address,
          {}
        );
      } catch (e) {
        console.log(e);
        notifyError('Failed to create account. Please try again.');
        if (isWindowMediumSmallInclusive(window.innerWidth)) {
          vnode.attrs.onModalClose();
        } else {
          vnode.attrs.onModalClose();
        }
      }
      this.bodyType = 'welcome';
    };

    // Handle branching logic for linking an account
    const linkExistingAccountCallback = async () => {
      this.bodyType = 'selectPrevious';
    };

    // Handle signature and validation logic for linking an account
    // Validates both linking (secondary) and primary accounts
    const performLinkingCallback = async () => {
      try {
        const secondaryTimestamp = +new Date();
        const { signature: secondarySignature, chainId: secondaryChainId } =
          await signSessionWithAccount(
            this.selectedLinkingWallet,
            this.secondaryLinkAccount,
            secondaryTimestamp
          );
        await this.secondaryLinkAccount.validate(
          secondarySignature,
          secondaryTimestamp,
          secondaryChainId
        );
        await this.primaryAccount.validate(
          this.cachedWalletSignature,
          this.cachedTimestamp,
          this.cachedChainId
        );
        // TODO call authSession here, which requires special handling because of
        // the call to signSessionWithAccount() earlier
        await logInWithAccount(this.primaryAccount, true);
      } catch (e) {
        console.log(e);
        notifyError('Unable to link account');
      }
    };

    // Handle saving profile information
    const saveProfileInfoCallback = async () => {
      const data = {
        name: this.username,
        avatarUrl: this.avatarUrl,
      };
      try {
        if (this.username || this.avatarUrl) {
          await app.newProfiles.updateProfileForAccount(
            this.primaryAccount.profile.address,
            data
          );
        }
        if (isWindowMediumSmallInclusive(window.innerWidth)) {
          vnode.attrs.onModalClose();
        } else {
          vnode.attrs.onModalClose();
        }
        if (onSuccess) onSuccess();
      } catch (e) {
        console.log(e);
        notifyError('Failed to save profile info');
        if (isWindowMediumSmallInclusive(window.innerWidth)) {
          vnode.attrs.onModalClose();
        } else {
          vnode.attrs.onModalClose();
        }
      }
    };

    return this.showMobile ? (
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
        setProfiles={(profiles: Array<ProfileRowProps>) => {
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
        showResetWalletConnect={wcEnabled}
        onModalClose={vnode.attrs.onModalClose}
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
        setProfiles={(profiles: Array<ProfileRowProps>) => {
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
        showResetWalletConnect={wcEnabled}
        onModalClose={vnode.attrs.onModalClose}
      />
    );
  }
}
