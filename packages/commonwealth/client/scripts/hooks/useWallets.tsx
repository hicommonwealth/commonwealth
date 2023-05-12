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
import WebWalletController from 'controllers/app/web_wallets';
import type Near from 'controllers/chain/near/adapter';
import type Substrate from 'controllers/chain/substrate/adapter';
import { signSessionWithAccount } from 'controllers/server/sessions';
import $ from 'jquery';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import app, { initAppState } from 'state';
import { addressSwapper } from 'utils';
import { setDarkMode } from '../helpers/darkMode';
import Account from '../models/Account';
import IWebWallet from '../models/IWebWallet';
import type { ProfileRowProps } from '../views/components/component_kit/cw_profiles_list';
import {
  breakpointFnValidator,
  isWindowMediumSmallInclusive,
} from '../views/components/component_kit/helpers';
import type {
  LoginActiveStep,
  LoginSidebarType,
} from '../views/pages/login/types';
import {
  getAddressFromWallet,
  loginToAxie,
  loginToNear,
} from '../helpers/wallet';

type IuseWalletProps = {
  initialBody?: LoginActiveStep;
  initialSidebar?: LoginSidebarType;
  initialAccount?: Account;
  initialWallets?: IWebWallet<any>[];
  onSuccess?: () => void;
  onModalClose: () => void;
  useSessionKeyLoginFlow?: boolean;
};

const useWallets = (walletProps: IuseWalletProps) => {
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [address, setAddress] = useState<string>();
  const [activeStep, setActiveStep] = useState<LoginActiveStep>();
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
      setWallets(WebWalletController.Instance.availableWallets(chainbase));
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
            return WebWalletController.Instance.availableWallets(base);
          })
        )
      );
      setSidebarType('connectWallet');
      setActiveStep('walletList');
    }

    setShowMobile(isWindowMediumSmallInclusive(window.innerWidth));

    // Override if initial data is provided (needed for redirecting wallets + CommonBot)
    if (walletProps.initialBody) {
      setActiveStep(walletProps.initialBody);
    }
    if (walletProps.initialSidebar) {
      setSidebarType(walletProps.initialSidebar);
    }
    if (walletProps.initialAccount) {
      setPrimaryAccount(walletProps.initialAccount);
      setAddress(walletProps.initialAccount.address);
    }
    // if (walletProps.initialWebWallet) {
    //   this.selectedWallet = walletProps.initialWebWallet;
    // }
    if (walletProps.initialWallets) {
      setWallets(walletProps.initialWallets);
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

      if (walletProps.onSuccess) walletProps.onSuccess();

      if (isWindowMediumSmallInclusive(window.innerWidth)) {
        walletProps.onModalClose();
      } else {
        walletProps.onModalClose();
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
    exitOnComplete: boolean,
    shouldRedrawApp: boolean = true
  ) => {
    const profile = account.profile;
    setAddress(account.address);

    if (profile.name) {
      setUsername(profile.name);
    }

    if (app.isLoggedIn()) {
      completeClientLogin(account);
    } else {
      // log in as the new user
      await initAppState(false, null, shouldRedrawApp);
      if (localStorage.getItem('user-dark-mode-state') === 'on') {
        setDarkMode(true);
      }
      if (app.chain) {
        const chain =
          app.user.selectedChain ||
          app.config.chains.getById(app.activeChainId());
        await updateActiveAddresses(chain);
      }
    }

    if (exitOnComplete) {
      walletProps.onModalClose();
      if (walletProps.onSuccess) walletProps.onSuccess();
    }
  };

  // Handle branching logic after wallet is selected
  const onAccountVerified = async (
    account: Account,
    newlyCreated: boolean,
    linking: boolean,
    currentWallet?: IWebWallet<any>
  ) => {
    if (walletProps.useSessionKeyLoginFlow) {
      walletProps.onModalClose();
      return;
    }

    const walletToUse = currentWallet || selectedWallet;

    // Handle Logged in and joining community of different chain base
    if (isInCommunityPage && app.isLoggedIn()) {
      const timestamp = +new Date();
      const { signature, chainId, sessionPayload } =
        await signSessionWithAccount(walletToUse, account, timestamp);
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
        const { signature, sessionPayload, chainId } =
          await signSessionWithAccount(walletToUse, account, timestamp);
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
          walletProps.onSuccess?.();
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
      await onLogInWithAccount(primaryAccount, false, false);
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
      walletProps.onModalClose();
    }
    setActiveStep('welcome');
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
      if (walletProps.onSuccess) walletProps.onSuccess();
      app.loginStateEmitter.emit('redraw'); // redraw app state when fully onboarded with new account
      walletProps.onModalClose();
    } catch (e) {
      console.log(e);
      notifyError('Failed to save profile info');
      walletProps.onModalClose();
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
      await loginToNear(app.chain as Near, app.isCustomDomain());
    } else if (wallet.defaultNetwork === 'axie-infinity') {
      await loginToAxie(`${app.serverUrl()}/auth/sso`);
    } else {
      const selectedAddress = getAddressFromWallet(wallet);

      if (walletProps.useSessionKeyLoginFlow) {
        await onSessionKeyRevalidation(wallet, selectedAddress);
      } else {
        await onNormalWalletLogin(wallet, selectedAddress);
      }
    }
  };

  const onWalletAddressSelect = async (
    wallet: IWebWallet<any>,
    selectedAddress: string
  ) => {
    setSelectedWallet(wallet);
    if (walletProps.useSessionKeyLoginFlow) {
      await onSessionKeyRevalidation(wallet, selectedAddress);
    } else {
      await onNormalWalletLogin(wallet, selectedAddress);
    }
  };

  const onNormalWalletLogin = async (
    wallet: IWebWallet<any>,
    selectedAddress: string
  ) => {
    setSelectedWallet(wallet);

    if (app.isLoggedIn()) {
      const { result } = await $.post(`${app.serverUrl()}/getAddressStatus`, {
        address:
          wallet.chain === ChainBase.Substrate
            ? addressSwapper({
                address: selectedAddress,
                currentPrefix: parseInt(
                  (app.chain as Substrate)?.meta.ss58Prefix,
                  10
                ),
              })
            : selectedAddress,
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
      const { account: signingAccount, newlyCreated } =
        await createUserWithAddress(
          selectedAddress,
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
        onAccountVerified(
          signingAccount,
          newlyCreated,
          isLinkingWallet,
          wallet
        );
      }
    } catch (err) {
      console.log(err);
    }
  };

  const onSessionKeyRevalidation = async (
    wallet: IWebWallet<any>,
    selectedAddress: string
  ) => {
    const timestamp = +new Date();
    const sessionAddress = await app.sessions.getOrCreateAddress(
      wallet.chain,
      wallet.getChainId().toString()
    );
    const chainIdentifier = app.chain?.id || wallet.defaultNetwork;
    const validationBlockInfo = await wallet.getRecentBlock(chainIdentifier);

    // Start the create-user flow, so validationBlockInfo gets saved to the backend
    // This creates a new `Account` object with fields set up to be validated by verifyAddress.
    const { account } = await createUserWithAddress(
      selectedAddress,
      wallet.name,
      chainIdentifier,
      sessionAddress,
      validationBlockInfo
    );
    account.setValidationBlockInfo(
      validationBlockInfo ? JSON.stringify(validationBlockInfo) : null
    );

    const { chainId, sessionPayload, signature } = await signSessionWithAccount(
      wallet,
      account,
      timestamp
    );
    await account.validate(signature, timestamp, chainId);
    await app.sessions.authSession(
      wallet.chain,
      chainId,
      sessionPayload,
      signature
    );
    console.log('Started new session for', wallet.chain, chainId);

    // ensure false for newlyCreated / linking vars on revalidate
    onAccountVerified(account, false, false);
    if (isMobile) {
      if (setSignerAccount) setSignerAccount(account);
      if (setIsNewlyCreated) setIsNewlyCreated(false);
      if (setIsLinkingOnMobile) setIsLinkingOnMobile(false);
      setActiveStep('redirectToSign');
      return;
    } else {
      onAccountVerified(account, false, false);
    }
  };

  return {
    showMobile,
    isNewlyCreated,
    isInCommunityPage,
    isLinkingOnMobile,
    signerAccount,
    address,
    activeStep,
    profiles,
    sidebarType,
    username,
    wallets,
    isMagicLoading,
    isWalletConnectEnabled,
    onCreateNewAccount,
    onWalletAddressSelect,
    onWalletSelect,
    onSaveProfileInfo,
    onResetWalletConnect,
    onPerformLinking,
    onEmailLogin,
    onLinkExistingAccount,
    setAvatarUrl,
    setEmail,
    onAccountVerified,
    setAddress,
    setActiveStep,
    setUsername,
    setSidebarType,
    onSessionKeyRevalidation,
  };
};

export default useWallets;
