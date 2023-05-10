import { ChainBase } from 'common-common/src/types';
import 'components/component_kit/cw_wallets_list.scss';
import {
  completeClientLogin,
  createUserWithAddress,
  loginWithMagicLink,
  updateActiveAddresses,
} from 'controllers/app/login';
import { notifyError, notifyInfo } from 'controllers/app/notifications';
import TerraWalletConnectWebWalletController from 'controllers/app/webWallets/terra_walletconnect_web_wallet';
import WalletConnectWebWalletController from 'controllers/app/webWallets/walletconnect_web_wallet';
import type Near from 'controllers/chain/near/adapter';
import type Substrate from 'controllers/chain/substrate/adapter';
import { signSessionWithAccount } from 'controllers/server/sessions';
import $ from 'jquery';
import _ from 'lodash';
import IWebWallet from '../../models/IWebWallet';
import Account from '../../models/Account';
import React, { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import app, { initAppState } from 'state';
import { addressSwapper } from 'utils';
import { setDarkMode } from '../../helpers/darkMode';
import type { ProfileRowProps } from '../components/component_kit/cw_profiles_list';
import {
  breakpointFnValidator,
  isWindowMediumSmallInclusive,
} from '../components/component_kit/helpers';
import { LoginDesktop } from '../pages/login/login_desktop';
import { LoginMobile } from '../pages/login/login_mobile';
import type { LoginActiveStep, LoginSidebarType } from '../pages/login/types';

type LoginModalAttrs = {
  initialBody?: LoginActiveStep;
  initialSidebar?: LoginSidebarType;
  initialAccount?: Account;
  initialWallets?: IWebWallet<any>[];
  onSuccess?: () => void;
  onModalClose: () => void;
};

export const LoginModal = (props: LoginModalAttrs) => {
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [address, setAddress] = useState<string>();
  const [activeStep, setActiveStep] = useState<LoginActiveStep>();
  const [profiles, setProfiles] = useState<Array<ProfileRowProps>>();
  const [sidebarType, setSidebarType] = useState<LoginSidebarType>();
  const [username, setUsername] = useState<string>();
  const [email, setEmail] = useState<string>();
  const [wallets, setWallets] = useState<Array<IWebWallet<any>>>();
  const [selectedWallet, setSelectedWallet] = useState<IWebWallet<any>>();
  const [selectedLinkingWallet, setSelectedLinkingWallet] = useState<
    IWebWallet<any>
  >();
  const [cachedWalletSignature, setCachedWalletSignature] = useState<string>();
  const [cachedTimestamp, setCachedTimestamp] = useState<number>();
  const [cachedChainId, setCachedChainId] = useState<string | number>();
  const [primaryAccount, setPrimaryAccount] = useState<Account>();
  const [secondaryLinkAccount, setSecondaryLinkAccount] = useState<Account>();
  // const [secondaryChainId, setSecondaryChainId] = useState<string | number>();
  const [isInCommunityPage, setIsInCommunityPage] = useState<boolean>();
  const [isMagicLoading, setIsMagicLoading] = useState<boolean>();
  const [showMobile, setShowMobile] = useState<boolean>();
  const [signerAccount, setSignerAccount] = useState<Account>(null);
  const [isNewlyCreated, setIsNewlyCreated] = useState<boolean>(false);
  const [isLinkingOnMobile, setIsLinkingOnMobile] = useState<boolean>(false);

  const isWalletConnectEnabled = _.some(
    wallets,
    (w) =>
      (w instanceof WalletConnectWebWalletController ||
        w instanceof TerraWalletConnectWebWalletController) &&
      w.enabled
  );

  const isLinkingWallet = activeStep === 'selectPrevious';

  useEffect(() => {
    // Determine if in a community
    const tempisInCommunityPage = app.activeChainId() !== undefined;
    setIsInCommunityPage(tempisInCommunityPage);

    if (tempisInCommunityPage) {
      const chainbase = app.chain?.meta?.base;
      setWallets(app.wallets.availableWallets(chainbase));
      setSidebarType('communityWalletOptions');
      setActiveStep('walletList');
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
      setActiveStep('walletList');
    }

    setShowMobile(isWindowMediumSmallInclusive(window.innerWidth));

    // Override if initial data is provided (needed for redirecting wallets + CommonBot)
    if (props.initialBody) {
      setActiveStep(props.initialBody);
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
  const onEmailLogin = async () => {
    setIsMagicLoading(true);

    if (!email) {
      notifyError('Please enter a valid email address.');
      setIsMagicLoading(false);
      return;
    }

    try {
      await loginWithMagicLink(email);
      setIsMagicLoading(false);

      if (props.onSuccess) props.onSuccess();

      if (isWindowMediumSmallInclusive(window.innerWidth)) {
        props.onModalClose();
      } else {
        props.onModalClose();
      }
    } catch (e) {
      notifyError("Couldn't send magic link");
      setIsMagicLoading(false);
      console.error(e);
    }
  };

  // Performs Login on the client
  const onLogInWithAccount = async (
    account: Account,
    exitOnComplete: boolean
  ) => {
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
  };

  // Handle branching logic after wallet is selected
  const onAccountVerified = async (
    account: Account,
    newlyCreated: boolean,
    linking: boolean,
    currentWallet?: IWebWallet<any>
  ) => {
    const walletToUse = currentWallet || selectedWallet;

    // Handle Logged in and joining community of different chain base
    if (isInCommunityPage && app.isLoggedIn()) {
      const timestamp = +new Date();
      const {
        signature,
        chainId,
        sessionPayload,
      } = await signSessionWithAccount(walletToUse, account, timestamp);
      await account.validate(signature, timestamp, chainId);
      app.sessions.authSession(
        app.chain.base,
        chainId,
        sessionPayload,
        signature
      );
      await onLogInWithAccount(account, true);
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
        const {
          signature,
          sessionPayload,
          chainId,
        } = await signSessionWithAccount(walletToUse, account, timestamp);
        await account.validate(signature, timestamp, chainId);
        // Can't call authSession now, since chain.base is unknown, so we wait till action
        await onLogInWithAccount(account, true);
      } catch (e) {
        console.log(e);
      }
    } else {
      if (!linking) {
        try {
          const timestamp = +new Date();
          const { signature, chainId } = await signSessionWithAccount(
            walletToUse,
            account,
            timestamp
          );
          // Can't call authSession now, since chain.base is unknown, so we wait till action
          setCachedWalletSignature(signature);
          setCachedTimestamp(timestamp);
          setCachedChainId(walletToUse.getChainId());
          props.onSuccess?.();
        } catch (e) {
          console.log(e);
        }
        setSidebarType('newOrReturning');
        setActiveStep('selectAccountType');
      } else {
        setSidebarType('newAddressLinked');
        setActiveStep('selectProfile');
      }
    }
  };

  // Handle Logic for creating a new account, including validating signature
  const onCreateNewAccount = async () => {
    try {
      if (selectedWallet.chain !== 'near') {
        await primaryAccount.validate(
          cachedWalletSignature,
          cachedTimestamp,
          cachedChainId
        );
      }
      await onLogInWithAccount(primaryAccount, false);
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
    setActiveStep('welcome');
    // redraw();
  };

  // Handle branching logic for linking an account
  const onLinkExistingAccount = async () => {
    setActiveStep('selectPrevious');
  };

  // Handle signature and validation logic for linking an account
  // Validates both linking (secondary) and primary accounts
  const onPerformLinking = async () => {
    try {
      const secondaryTimestamp = +new Date();
      const {
        signature: secondarySignature,
        chainId: secondaryChainId,
      } = await signSessionWithAccount(
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
      await onLogInWithAccount(primaryAccount, true);
    } catch (e) {
      console.log(e);
      notifyError('Unable to link account');
    }
  };

  // Handle saving profile information
  const onSaveProfileInfo = async () => {
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
  };

  const onResetWalletConnect = async () => {
    const wallet = wallets.find(
      (w) =>
        w instanceof WalletConnectWebWalletController ||
        w instanceof TerraWalletConnectWebWalletController
    );

    await wallet.reset();
  };

  const onWalletSelect = async (wallet: IWebWallet<any>) => {
    await wallet.enable();

    if (activeStep === 'selectPrevious') {
      setSelectedLinkingWallet(wallet);
    } else {
      setSelectedWallet(wallet);
    }

    if (wallet.chain === 'near') {
      // Near Redirect Flow
      const WalletAccount = (await import('near-api-js')).WalletAccount;
      if (!app.chain.apiInitialized) {
        await app.chain.initApi();
      }
      const nearWallet = new WalletAccount(
        (app.chain as Near).chain.api,
        'commonwealth_near'
      );
      if (nearWallet.isSignedIn()) {
        nearWallet.signOut();
      }
      const redirectUrl = !app.isCustomDomain()
        ? `${window.location.origin}/${app.activeChainId()}/finishNearLogin`
        : `${window.location.origin}/finishNearLogin`;
      nearWallet.requestSignIn({
        contractId: (app.chain as Near).chain.isMainnet
          ? 'commonwealth-login.near'
          : 'commonwealth-login.testnet',
        successUrl: redirectUrl,
        failureUrl: redirectUrl,
      });
    } else if (wallet.defaultNetwork === 'axie-infinity') {
      // Axie Redirect Flow
      const result = await $.post(`${app.serverUrl()}/auth/sso`, {
        issuer: 'AxieInfinity',
      });
      if (result.status === 'Success' && result.result.stateId) {
        const stateId = result.result.stateId;

        // redirect to axie page for login
        // eslint-disable-next-line max-len
        window.location.href = `https://app.axieinfinity.com/login/?src=commonwealth&stateId=${stateId}`;
      } else {
        console.log(result.error || 'Could not login');
      }
    } else {
      // Normal Wallet Flow
      let selectedAddress;
      if (wallet.chain === 'ethereum' || wallet.chain === 'solana') {
        selectedAddress = wallet.accounts[0];
      } else if (wallet.defaultNetwork === 'terra') {
        selectedAddress = wallet.accounts[0].address;
      } else if (wallet.chain === 'cosmos') {
        if (wallet.defaultNetwork === 'injective') {
          selectedAddress = wallet.accounts[0];
        } else {
          selectedAddress = wallet.accounts[0].address;
        }
      }

      await onNormalWalletLogin(wallet, selectedAddress);
    }
  };

  const onWalletAddressSelect = async (
    wallet: IWebWallet<any>,
    address: string
  ) => {
    setSelectedWallet(wallet);
    await onNormalWalletLogin(wallet, address);
  };

  async function onNormalWalletLogin(wallet: IWebWallet<any>, address: string) {
    setSelectedWallet(wallet);

    if (app.isLoggedIn()) {
      const { result } = await $.post(`${app.serverUrl()}/getAddressStatus`, {
        address:
          wallet.chain === ChainBase.Substrate
            ? addressSwapper({
                address,
                currentPrefix: parseInt(
                  (app.chain as Substrate)?.meta.ss58Prefix,
                  10
                ),
              })
            : address,
        chain: app.activeChainId() ?? wallet.chain,
        jwt: app.user.jwt,
      });
      if (result.exists && result.belongsToUser) {
        notifyInfo('This address is already linked to your current account.');
        return;
      }
      if (result.exists) {
        notifyInfo(
          'This address is already linked to another account. Signing will transfer ownership to your account.'
        );
      }
    }

    try {
      const sessionPublicAddress = await app.sessions.getOrCreateAddress(
        wallet.chain,
        wallet.getChainId().toString()
      );
      const chainIdentifier = app.chain?.id || wallet.defaultNetwork;
      const validationBlockInfo =
        wallet.getRecentBlock && (await wallet.getRecentBlock(chainIdentifier));
      const {
        account: signingAccount,
        newlyCreated,
      } = await createUserWithAddress(
        address,
        wallet.name,
        chainIdentifier,
        sessionPublicAddress,
        validationBlockInfo
      );

      if (isMobile) {
        setSignerAccount(signingAccount);
        setIsNewlyCreated(newlyCreated);
        setIsLinkingOnMobile(isLinkingWallet);
        setActiveStep('redirectToSign');
        return;
      } else {
        onAccountVerified(signerAccount, newlyCreated, isLinkingWallet, wallet);
      }
    } catch (err) {
      console.log(err);
    }
  }

  const LoginModule = showMobile ? LoginMobile : LoginDesktop;

  return (
    <LoginModule
      isNewlyCreated={isNewlyCreated}
      isLinkingOnMobile={isLinkingOnMobile}
      signerAccount={signerAccount}
      address={address}
      isInCommunityPage={isInCommunityPage}
      activeStep={activeStep}
      profiles={profiles}
      sidebarType={sidebarType}
      username={username}
      wallets={wallets}
      isMagicLoading={isMagicLoading}
      canResetWalletConnect={isWalletConnectEnabled}
      onCreateNewAccount={onCreateNewAccount}
      onLinkExistingAccount={onLinkExistingAccount}
      onEmailLogin={onEmailLogin}
      onSaveProfileInfo={onSaveProfileInfo}
      onPerformLinking={onPerformLinking}
      onModalClose={props.onModalClose}
      onAccountVerified={onAccountVerified}
      onConnectAnotherWay={() => setActiveStep('connectWithEmail')}
      onResetWalletConnect={onResetWalletConnect}
      onWalletSelect={onWalletSelect}
      onWalletAddressSelect={onWalletAddressSelect}
      setAddress={(a: string) => {
        setAddress(a);
      }}
      setActiveStep={(bT: LoginActiveStep) => {
        setActiveStep(bT);
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
      setSidebarType={(sT: LoginSidebarType) => {
        setSidebarType(sT);
      }}
    />
  );
};
