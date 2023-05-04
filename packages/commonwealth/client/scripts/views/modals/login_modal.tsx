import { ChainBase } from 'common-common/src/types';
import {
  completeClientLogin,
  loginWithMagicLink,
  updateActiveAddresses,
} from 'controllers/app/login';
import { notifyError } from 'controllers/app/notifications';
import TerraWalletConnectWebWalletController from 'controllers/app/webWallets/terra_walletconnect_web_wallet';
import WalletConnectWebWalletController from 'controllers/app/webWallets/walletconnect_web_wallet';
import { signSessionWithAccount } from 'controllers/server/sessions';
import _ from 'lodash';
import type { Account, IWebWallet } from 'models';
import React, { useCallback, useEffect, useState } from 'react';
import app, { initAppState } from 'state';
import { setDarkMode } from '../../helpers';
import type { ProfileRowProps } from '../components/component_kit/cw_profiles_list';
import {
  breakpointFnValidator,
  isWindowMediumSmallInclusive,
} from '../components/component_kit/helpers';
import { LoginDesktop } from '../pages/login/login_desktop';
import { LoginMobile } from '../pages/login/login_mobile';
import type { LoginBodyType, LoginSidebarType } from '../pages/login/types';

type LoginModalAttrs = {
  initialBody?: LoginBodyType;
  initialSidebar?: LoginSidebarType;
  initialAccount?: Account;
  initialWallets?: IWebWallet<any>[];
  onSuccess?: () => void;
  onModalClose: () => void;
};

const LoginModal = (props: LoginModalAttrs) => {
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

  useEffect(() => {
    // Determine if in a community
    const tempCurrentlyInCommunityPage = app.activeChainId() !== undefined;
    setCurrentlyInCommunityPage(tempCurrentlyInCommunityPage);

    if (tempCurrentlyInCommunityPage) {
      const chainbase = app.chain?.meta?.base;
      setWallets(app.wallets.availableWallets(chainbase));
      setSidebarType('communityWalletOptions');
      setBodyType('walletList');
    } else {
      const allChains = app.config.chains.getAll();
      const sortedChainBases = [
        ChainBase.CosmosSDK,
        ChainBase.Ethereum,
        // ChainBase.NEAR,
        ChainBase.Substrate,
        ChainBase.Solana,
      ].filter((base) => allChains.find((chain) => chain.base === base));
      setWallets(
        _.flatten(
          sortedChainBases.map((base) => {
            return app.wallets.availableWallets(base);
          })
        )
      );
      setSidebarType('connectWallet');
      setBodyType('walletList');
    }

    setShowMobile(isWindowMediumSmallInclusive(window.innerWidth));

    // Override if initial data is provided (needed for redirecting wallets + CommonBot)
    if (props.initialBody) {
      setBodyType(props.initialBody);
    }
    if (props.initialSidebar) {
      setSidebarType(props.initialSidebar);
    }
    if (props.initialAccount) {
      setPrimaryAccount(props.initialAccount);
      setAddress(props.initialAccount.address);
    }
    // if (props.initialWebWallet) {
    //   this.selectedWallet = props.initialWebWallet;
    // }
    if (props.initialWallets) {
      setWallets(props.initialWallets);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line no-restricted-globals
    addEventListener('resize', () =>
      breakpointFnValidator(
        showMobile,
        (state: boolean) => {
          setShowMobile(state);
        },
        isWindowMediumSmallInclusive
      )
    );

    return () => {
      // eslint-disable-next-line no-restricted-globals
      removeEventListener('resize', () =>
        breakpointFnValidator(
          showMobile,
          (state: boolean) => {
            setShowMobile(state);
          },
          isWindowMediumSmallInclusive
        )
      );
    };
  }, [showMobile]);

  // Handles Magic Link Login
  const handleEmailLoginCallback = useCallback(async () => {
    setMagicLoading(true);

    if (!email) {
      notifyError('Please enter a valid email address.');
      setMagicLoading(false);
      return;
    }

    try {
      await loginWithMagicLink(email);
      setMagicLoading(false);

      if (props.onSuccess) props.onSuccess();

      if (isWindowMediumSmallInclusive(window.innerWidth)) {
        props.onModalClose();
      } else {
        props.onModalClose();
      }
    } catch (e) {
      notifyError("Couldn't send magic link");
      setMagicLoading(false);
      console.error(e);
    }
  }, [email, props.onSuccess, props.onModalClose]);

  // Performs Login on the client
  const logInWithAccount = useCallback(
    async (account: Account, exitOnComplete: boolean) => {
      const profile = account.profile;
      setAddress(account.address);

      if (profile.name) {
        setUsername(profile.name);
      }

      if (app.isLoggedIn()) {
        completeClientLogin(account);
        if (exitOnComplete) {
          if (isWindowMediumSmallInclusive(window.innerWidth)) {
            props.onModalClose();
          } else {
            props.onModalClose();
          }
          if (props.onSuccess) props.onSuccess();
        }
        // redraw();
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
            props.onModalClose();
          } else {
            props.onModalClose();
          }
          if (props.onSuccess) props.onSuccess();
        }
        // redraw();
      }
    },
    [props.onModalClose, props.onSuccess]
  );

  // Handle branching logic after wallet is selected
  const accountVerifiedCallback = useCallback(
    async (account: Account, newlyCreated: boolean, linking: boolean) => {
      // Handle Logged in and joining community of different chain base
      if (currentlyInCommunityPage && app.isLoggedIn()) {
        const timestamp = +new Date();
        const { signature, chainId, sessionPayload } =
          await signSessionWithAccount(selectedWallet, account, timestamp);
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
        setPrimaryAccount(account);
        setAddress(account.address);
        setProfiles([account.profile]);
      } else {
        if (newlyCreated) {
          notifyError("This account doesn't exist");
          return;
        }
        if (account.address === primaryAccount.address) {
          notifyError("You can't link to the same account");
          return;
        }
        setSecondaryLinkAccount(account);
        setProfiles(
          [account.profile] // TODO: Update when User -> Many Profiles goes in
        );
      }

      // Handle receiving and caching wallet signature strings
      if (!newlyCreated && !linking) {
        try {
          const timestamp = +new Date();
          const { signature, sessionPayload, chainId } =
            await signSessionWithAccount(selectedWallet, account, timestamp);
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
              selectedWallet,
              account,
              timestamp
            );
            // Can't call authSession now, since chain.base is unknown, so we wait till action
            setCachedWalletSignature(signature);
            setCachedTimestamp(timestamp);
            setCachedChainId(selectedWallet.getChainId());
            props.onSuccess?.();
          } catch (e) {
            console.log(e);
          }
          setSidebarType('newOrReturning');
          setBodyType('selectAccountType');
        } else {
          setSidebarType('newAddressLinked');
          setBodyType('selectProfile');
        }
      }
    },
    [
      currentlyInCommunityPage,
      selectedWallet,
      logInWithAccount,
      primaryAccount,
      props.onSuccess,
    ]
  );

  // Handle Logic for creating a new account, including validating signature
  const createNewAccountCallback = useCallback(async () => {
    try {
      if (selectedWallet.chain !== 'near') {
        await primaryAccount.validate(
          cachedWalletSignature,
          cachedTimestamp,
          cachedChainId
        );
      }
      await logInWithAccount(primaryAccount, false);
      // Important: when we first create an account and verify it, the user id
      // is initially null from api (reloading the page will update it), to correct
      // it we need to get the id from api
      await app.newProfiles.updateProfileForAccount(
        primaryAccount.profile.address,
        {}
      );
    } catch (e) {
      console.log(e);
      notifyError('Failed to create account. Please try again.');
      if (isWindowMediumSmallInclusive(window.innerWidth)) {
        props.onModalClose();
      } else {
        props.onModalClose();
      }
    }
    setBodyType('welcome');
    // redraw();
  }, [
    props.onModalClose,
    primaryAccount,
    logInWithAccount,
    cachedWalletSignature,
    cachedTimestamp,
    cachedChainId,
    selectedWallet,
  ]);

  // Handle branching logic for linking an account
  const linkExistingAccountCallback = async () => {
    setBodyType('selectPrevious');
  };

  // Handle signature and validation logic for linking an account
  // Validates both linking (secondary) and primary accounts
  const performLinkingCallback = useCallback(async () => {
    try {
      const secondaryTimestamp = +new Date();
      const { signature: secondarySignature, chainId: secondaryChainId } =
        await signSessionWithAccount(
          selectedLinkingWallet,
          secondaryLinkAccount,
          secondaryTimestamp
        );
      await secondaryLinkAccount.validate(
        secondarySignature,
        secondaryTimestamp,
        secondaryChainId
      );
      await primaryAccount.validate(
        cachedWalletSignature,
        cachedTimestamp,
        cachedChainId
      );
      // Can't call authSession now, since chain.base is unknown, so we wait till action
      await logInWithAccount(primaryAccount, true);
    } catch (e) {
      console.log(e);
      notifyError('Unable to link account');
    }
  }, [
    selectedLinkingWallet,
    secondaryLinkAccount,
    primaryAccount,
    cachedWalletSignature,
    cachedTimestamp,
    cachedChainId,
    logInWithAccount,
  ]);

  // Handle saving profile information
  const saveProfileInfoCallback = useCallback(async () => {
    const data = {
      name: username,
      avatarUrl: avatarUrl,
    };
    try {
      if (username || avatarUrl) {
        await app.newProfiles.updateProfileForAccount(
          primaryAccount.profile.address,
          data
        );
      }
      if (isWindowMediumSmallInclusive(window.innerWidth)) {
        props.onModalClose();
      } else {
        props.onModalClose();
      }
      if (props.onSuccess) props.onSuccess();
      // redraw();
    } catch (e) {
      console.log(e);
      notifyError('Failed to save profile info');
      if (isWindowMediumSmallInclusive(window.innerWidth)) {
        props.onModalClose();
      } else {
        props.onModalClose();
      }
    }
  }, [
    props.onModalClose,
    props.onSuccess,
    primaryAccount,
    username,
    avatarUrl,
  ]);

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

export { LoginModal };
