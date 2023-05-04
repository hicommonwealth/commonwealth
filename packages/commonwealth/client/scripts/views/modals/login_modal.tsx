import React, { useState, useCallback } from 'react';

import _ from 'lodash';
import app, { initAppState } from 'state';
import { ChainBase } from 'common-common/src/types';
import { ClassComponent, redraw } from 'mithrilInterop';
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
import type { Account, IWebWallet } from 'models';

import {
  breakpointFnValidator,
  isWindowMediumSmallInclusive,
} from '../components/component_kit/helpers';
import type { ProfileRowProps } from '../components/component_kit/cw_profiles_list';
import { LoginDesktop } from '../pages/login/login_desktop';
import { LoginMobile } from '../pages/login/login_mobile';
import type { LoginBodyType, LoginSidebarType } from '../pages/login/types';
import { setDarkMode } from '../../helpers';

type LoginModalAttrs = {
  initialBody?: LoginBodyType;
  initialSidebar?: LoginSidebarType;
  initialAccount?: Account;
  initialWallets?: IWebWallet<any>[];
  onSuccess?: () => void;
  onModalClose: () => void;
};

class LoginModal extends ClassComponent<LoginModalAttrs> {
  oncreate(vnode: ResultNode<LoginModalAttrs>) {
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
        redraw();
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
        redraw();
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
        app.sessions.authSession(
          app.chain.base,
          chainId,
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
          // Can't call authSession now, since chain.base is unknown, so we wait till action
          await logInWithAccount(account, true);
        } catch (e) {
          console.log(e);
        }
      } else {
        if (!linking) {
          try {
            const timestamp = +new Date();
            const { signature, chainId } = await signSessionWithAccount(
              this.selectedWallet,
              account,
              timestamp
            );
            // Can't call authSession now, since chain.base is unknown, so we wait till action
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
      redraw();
    };

    // Handle branching logic for linking an account
    const linkExistingAccountCallback = async () => {
      this.bodyType = 'selectPrevious';
      redraw();
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
        // Can't call authSession now, since chain.base is unknown, so we wait till action
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
        redraw();
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
  }
}

const LoginModalReact = (props: LoginModalAttrs) => {
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [address, setAddress] = useState<string>();
  const [bodyType, setBodyType] = useState<LoginBodyType>();
  const [profiles, setProfiles] = useState<Array<ProfileRowProps>>();
  const [sidebarType, setSidebarType] = useState<LoginSidebarType>();
  const [username, setUsername] = useState<string>();
  const [email, setEmail] = useState<string>();
  const [wallets, setWallets] = useState<Array<IWebWallet<any>>>();
  const [selectedWallet, setSelectedWallet] = useState<IWebWallet<any>>();
  const [selectedLinkingWallet, setSelectedLinkingWallet] =
    useState<IWebWallet<any>>();
  const [cachedWalletSignature, setCachedWalletSignature] = useState<string>();
  const [cachedTimestamp, setCachedTimestamp] = useState<number>();
  const [cachedChainId, setCachedChainId] = useState<string | number>();
  const [primaryAccount, setPrimaryAccount] = useState<Account>();
  const [secondaryLinkAccount, setSecondaryLinkAccount] = useState<Account>();
  const [secondaryChainId, setSecondaryChainId] = useState<string | number>();
  const [currentlyInCommunityPage, setCurrentlyInCommunityPage] =
    useState<boolean>();
  const [magicLoading, setMagicLoading] = useState<boolean>();
  const [showMobile, setShowMobile] = useState<boolean>();

  const wcEnabled = _.some(
    wallets,
    (w) =>
      (w instanceof WalletConnectWebWalletController ||
        w instanceof TerraWalletConnectWebWalletController) &&
      w.enabled
  );

  // Handles Magic Link Login
  const handleEmailLoginCallback = useCallback(async () => {}, []);

  // Performs Login on the client
  const logInWithAccount = useCallback(async () => {}, []);

  // Handle branching logic after wallet is selected
  const accountVerifiedCallback = useCallback(async () => {}, []);

  // Handle Logic for creating a new account, including validating signature
  const createNewAccountCallback = useCallback(async () => {}, []);

  // Handle branching logic for linking an account
  const linkExistingAccountCallback = async () => {
    setBodyType('selectPrevious');
  };

  // Handle signature and validation logic for linking an account
  // Validates both linking (secondary) and primary accounts
  const performLinkingCallback = useCallback(async () => {}, []);

  // Handle saving profile information
  const saveProfileInfoCallback = useCallback(async () => {}, []);

  const LoginModule = showMobile ? LoginMobile : LoginDesktop;

  return (
    <LoginModule
      address={address}
      currentlyInCommunityPage={currentlyInCommunityPage}
      bodyType={bodyType}
      profiles={profiles}
      sidebarType={sidebarType}
      username={username}
      wallets={wallets}
      magicLoading={magicLoading}
      setAddress={(a: string) => {
        setAddress(a);
      }}
      setBodyType={(bT: LoginBodyType) => {
        setBodyType(bT);
      }}
      handleSetAvatar={(a) => {
        setAvatarUrl(a);
      }}
      handleSetUsername={(u) => {
        setUsername(u);
      }}
      handleSetEmail={(e) => {
        setEmail(e.target.value);
      }}
      setProfiles={(p: Array<ProfileRowProps>) => {
        setProfiles(p);
      }}
      setSidebarType={(sT: LoginSidebarType) => {
        setSidebarType(sT);
      }}
      setSelectedWallet={(w: IWebWallet<any>) => {
        setSelectedWallet(w);
      }}
      setSelectedLinkingWallet={(w: IWebWallet<any>) => {
        setSelectedLinkingWallet(w);
      }}
      createNewAccountCallback={createNewAccountCallback}
      linkExistingAccountCallback={linkExistingAccountCallback}
      accountVerifiedCallback={accountVerifiedCallback}
      handleEmailLoginCallback={handleEmailLoginCallback}
      saveProfileInfoCallback={saveProfileInfoCallback}
      performLinkingCallback={performLinkingCallback}
      showResetWalletConnect={wcEnabled}
      onModalClose={props.onModalClose}
    />
  );
};

export default LoginModal;
