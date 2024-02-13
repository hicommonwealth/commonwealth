/* eslint-disable react-hooks/exhaustive-deps */
import type { SessionPayload } from '@canvas-js/interfaces';
import { ChainBase, WalletSsoSource } from '@hicommonwealth/core';
import 'components/component_kit/cw_wallets_list.scss';
import {
  completeClientLogin,
  createUserWithAddress,
  startLoginWithMagicLink,
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
import { useUpdateProfileByAddressMutation } from 'state/api/profiles';
import { addressSwapper } from 'utils';
import {
  BaseMixpanelPayload,
  MixpanelCommunityInteractionEvent,
  MixpanelLoginEvent,
  MixpanelLoginPayload,
} from '../../../shared/analytics/types';
import NewProfilesController from '../controllers/server/newProfiles';
import { setDarkMode } from '../helpers/darkMode';
import {
  getAddressFromWallet,
  loginToAxie,
  loginToNear,
} from '../helpers/wallet';
import Account from '../models/Account';
import IWebWallet from '../models/IWebWallet';
import { DISCOURAGED_NONREACTIVE_fetchProfilesByAddress } from '../state/api/profiles/fetchProfilesByAddress';
import type { ProfileRowProps } from '../views/components/component_kit/cw_profiles_list';
import {
  breakpointFnValidator,
  isWindowMediumSmallInclusive,
} from '../views/components/component_kit/helpers';
import type {
  LoginActiveStep,
  LoginSidebarType,
} from '../views/pages/login/types';
import { useBrowserAnalyticsTrack } from './useBrowserAnalyticsTrack';
import useBrowserWindow from './useBrowserWindow';
import { useFlag } from './useFlag';

type IuseWalletProps = {
  initialBody?: LoginActiveStep;
  initialSidebar?: LoginSidebarType;
  initialAccount?: Account;
  initialWallets?: IWebWallet<any>[];
  onSuccess?: (address?: string | undefined) => void;
  onModalClose: () => void;
  useSessionKeyLoginFlow?: boolean;
};

const useWallets = (walletProps: IuseWalletProps) => {
  const newSignInModalEnabled = useFlag('newSignInModal');
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [address, setAddress] = useState<string>();
  const [activeStep, setActiveStep] = useState<LoginActiveStep>();
  const [profiles, setProfiles] = useState<Array<ProfileRowProps>>();
  const [sidebarType, setSidebarType] = useState<LoginSidebarType>();
  const [username, setUsername] = useState<string>(
    newSignInModalEnabled ? 'Anonymous' : '',
  );
  const [email, setEmail] = useState<string>();
  const [wallets, setWallets] = useState<Array<IWebWallet<any>>>();
  const [selectedWallet, setSelectedWallet] = useState<IWebWallet<any>>();
  const [selectedLinkingWallet, setSelectedLinkingWallet] =
    useState<IWebWallet<any>>();
  const [cachedWalletSignature, setCachedWalletSignature] = useState<string>();
  const [cachedTimestamp, setCachedTimestamp] = useState<number>();
  const [cachedChainId, setCachedChainId] = useState<string>();
  const [cachedSessionPayload, setCachedSessionPayload] =
    useState<SessionPayload>();
  const [primaryAccount, setPrimaryAccount] = useState<Account>();
  const [secondaryLinkAccount, setSecondaryLinkAccount] = useState<Account>();
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
      w.enabled,
  );

  const isLinkingWallet = activeStep === 'selectPrevious';

  const { trackAnalytics } = useBrowserAnalyticsTrack<
    MixpanelLoginPayload | BaseMixpanelPayload
  >({
    onAction: true,
  });

  const { mutateAsync: updateProfile } = useUpdateProfileByAddressMutation();

  useBrowserWindow({
    onResize: () =>
      breakpointFnValidator(
        showMobile,
        (state: boolean) => {
          setShowMobile(state);
        },
        isWindowMediumSmallInclusive,
      ),
    resizeListenerUpdateDeps: [showMobile],
  });

  useEffect(() => {
    if (process.env.ETH_RPC === 'e2e-test') {
      import('../helpers/mockMetaMaskUtil').then((f) => {
        window['ethereum'] = new f.MockMetaMaskProvider(
          'https://eth-mainnet.g.alchemy.com/v2/pZsX6R3wGdnwhUJHlVmKg4QqsiS32Qm4',
          '0x09187906d2ff8848c20050df632152b5b27d816ec62acd41d4498feb522ac5c3',
        );
      });
    }

    // Determine if in a community
    const tempIsInCommunityPage = app.activeChainId() !== undefined;
    setIsInCommunityPage(tempIsInCommunityPage);

    if (tempIsInCommunityPage) {
      const chainbase = app.chain?.base;
      setWallets(WebWalletController.Instance.availableWallets(chainbase));
      setSidebarType('communityWalletOptions');
      setActiveStep('walletList');
    } else {
      const allCommunities = app.config.chains.getAll();
      const sortedChainBases = [
        ChainBase.CosmosSDK,
        ChainBase.Ethereum,
        // ChainBase.NEAR,
        ChainBase.Substrate,
        ChainBase.Solana,
      ].filter((base) => allCommunities.find((chain) => chain.base === base));
      setWallets(
        _.flatten(
          sortedChainBases.map((base) => {
            return WebWalletController.Instance.availableWallets(base);
          }),
        ),
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
    if (walletProps.initialWallets) {
      setWallets(walletProps.initialWallets);
    }
  }, []);

  // Handles Magic Link Login
  const onEmailLogin = async (emailToUse = '') => {
    const tempEmailToUse = emailToUse || email;
    setEmail(tempEmailToUse);

    setIsMagicLoading(true);

    if (!tempEmailToUse) {
      notifyError('Please enter a valid email address.');
      setIsMagicLoading(false);
      return;
    }

    try {
      const isCosmos = app.chain?.base === ChainBase.CosmosSDK;
      const { address: magicAddress } = await startLoginWithMagicLink({
        email: tempEmailToUse,
        isCosmos,
        redirectTo: document.location.pathname + document.location.search,
        chain: app.chain?.id,
      });
      setIsMagicLoading(false);

      if (walletProps.onSuccess) walletProps.onSuccess(magicAddress);

      if (isWindowMediumSmallInclusive(window.innerWidth)) {
        walletProps.onModalClose();
      } else {
        walletProps.onModalClose();
      }

      trackAnalytics({
        event: MixpanelLoginEvent.LOGIN,
        community: app?.activeChainId(),
        communityType: app?.chain?.meta?.base,
        loginOption: 'email',
        isSocialLogin: true,
        loginPageLocation: isInCommunityPage ? 'community' : 'homepage',
        isMobile,
      });
    } catch (e) {
      notifyError("Couldn't send magic link");
      setIsMagicLoading(false);
      console.error(e.stack);
    }
  };

  // New callback for handling social login
  const onSocialLogin = async (provider: WalletSsoSource) => {
    setIsMagicLoading(true);

    try {
      const isCosmos = app?.chain?.base === ChainBase.CosmosSDK;
      const { address: magicAddress } = await startLoginWithMagicLink({
        provider,
        isCosmos,
        redirectTo: document.location.pathname + document.location.search,
        chain: app.chain?.id,
      });
      setIsMagicLoading(false);

      if (walletProps.onSuccess) walletProps.onSuccess(magicAddress);

      if (isWindowMediumSmallInclusive(window.innerWidth)) {
        walletProps.onModalClose();
      } else {
        walletProps.onModalClose();
      }
      trackAnalytics({
        event: MixpanelLoginEvent.LOGIN,
        community: app?.activeChainId(),
        communityType: app?.chain?.meta?.base,
        loginOption: provider,
        isSocialLogin: true,
        loginPageLocation: isInCommunityPage ? 'community' : 'homepage',
        isMobile,
      });
    } catch (e) {
      notifyError("Couldn't send magic link");
      setIsMagicLoading(false);
      console.error(e.stack);
    }
  };

  // Performs Login on the client
  const onLogInWithAccount = async (
    account: Account,
    exitOnComplete: boolean,
    shouldRedrawApp = true,
  ) => {
    const profile = account.profile;
    setAddress(account.address);

    if (profile.name && profile.initialized) {
      setUsername(profile.name);
    }

    if (app.isLoggedIn()) {
      completeClientLogin(account);
    } else {
      // log in as the new user
      await initAppState(false, shouldRedrawApp);
      if (localStorage.getItem('user-dark-mode-state') === 'on') {
        setDarkMode(true);
      }
      if (app.chain) {
        const community =
          app.user.selectedChain ||
          app.config.chains.getById(app.activeChainId());
        await updateActiveAddresses({
          chain: community,
          shouldRedraw: shouldRedrawApp,
        });
      }
    }

    if (exitOnComplete) {
      walletProps.onModalClose();
      if (walletProps.onSuccess) walletProps.onSuccess(account.address);
    }
  };

  // Handle branching logic after wallet is selected
  const onAccountVerified = async (
    account: Account,
    newlyCreated: boolean,
    linking: boolean,
    currentWallet?: IWebWallet<any>,
  ) => {
    if (walletProps.useSessionKeyLoginFlow) {
      walletProps.onSuccess?.(account.address);
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
        account.address,
        sessionPayload,
        signature,
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
        [account.profile], // TODO: Update when User -> Many Profiles goes in
      );
    }

    // Handle receiving and caching wallet signature strings
    if (!newlyCreated && !linking) {
      try {
        const timestamp = +new Date();
        const { signature, sessionPayload, chainId } =
          await signSessionWithAccount(walletToUse, account, timestamp);
        await account.validate(signature, timestamp, chainId);
        await app.sessions.authSession(
          app.chain ? app.chain.base : walletToUse.chain,
          chainId,
          account.address,
          sessionPayload,
          signature,
        );
        await onLogInWithAccount(account, true);
      } catch (e) {
        console.log(e);
      }
    } else {
      if (!linking) {
        try {
          const timestamp = +new Date();
          const { signature, chainId, sessionPayload } =
            await signSessionWithAccount(walletToUse, account, timestamp);
          // Can't call authSession now, since chain.base is unknown, so we wait till action
          setCachedWalletSignature(signature);
          setCachedTimestamp(timestamp);
          setCachedChainId(chainId);
          setCachedSessionPayload(sessionPayload);
          walletProps.onSuccess?.(account.address);
          setSidebarType('newOrReturning');
          setActiveStep('selectAccountType');

          if (newSignInModalEnabled) {
            // Create the account with default values
            await onCreateNewAccount(
              walletToUse,
              signature,
              timestamp,
              chainId,
              sessionPayload,
              account,
            );
            await onSaveProfileInfo(account);
          }
        } catch (e) {
          console.log(e);
        }
      } else {
        setSidebarType('newAddressLinked');
        setActiveStep('selectProfile');
      }
    }
  };

  // Handle Logic for creating a new account, including validating signature
  const onCreateNewAccount = async (
    currentWallet?: IWebWallet<any>,
    currentCachedWalletSignature?: string,
    currentCachedTimestamp?: number,
    currentCachedChainId?: string,
    currentCachedSessionPayload?: SessionPayload,
    currentPrimaryAccount?: Account,
  ) => {
    const walletToUse = currentWallet || selectedWallet;
    const cachedWalletSignatureToUse =
      currentCachedWalletSignature || cachedWalletSignature;
    const cachedTimestampToUse = currentCachedTimestamp || cachedTimestamp;
    const cachedChainIdToUse = currentCachedChainId || cachedChainId;
    const cachedSessionPayloadToUse =
      currentCachedSessionPayload || cachedSessionPayload;
    const primaryAccountToUse = currentPrimaryAccount || primaryAccount;

    try {
      if (walletToUse.chain !== 'near') {
        await primaryAccountToUse.validate(
          cachedWalletSignatureToUse,
          cachedTimestampToUse,
          cachedChainIdToUse,
          false,
        );
        await app.sessions.authSession(
          walletToUse.chain,
          cachedChainIdToUse,
          primaryAccountToUse.address,
          cachedSessionPayloadToUse,
          cachedWalletSignatureToUse,
        );
      }
      await onLogInWithAccount(primaryAccountToUse, false, false);
      // Important: when we first create an account and verify it, the user id
      // is initially null from api (reloading the page will update it), to correct
      // it we need to get the id from api
      const updatedProfiles =
        await DISCOURAGED_NONREACTIVE_fetchProfilesByAddress(
          primaryAccountToUse.profile.chain,
          primaryAccountToUse.profile.address,
        );
      const currentUserUpdatedProfile = updatedProfiles[0];
      if (!currentUserUpdatedProfile) {
        console.log('No profile yet.');
      } else {
        primaryAccountToUse.profile.initialize(
          currentUserUpdatedProfile?.name,
          currentUserUpdatedProfile.address,
          currentUserUpdatedProfile?.avatarUrl,
          currentUserUpdatedProfile.id,
          primaryAccountToUse.profile.chain,
          currentUserUpdatedProfile?.lastActive,
        );
      }
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
          secondaryTimestamp,
        );
      await secondaryLinkAccount.validate(
        secondarySignature,
        secondaryTimestamp,
        secondaryChainId,
      );
      await primaryAccount.validate(
        cachedWalletSignature,
        cachedTimestamp,
        cachedChainId,
      );
      // TODO: call authSession here, which requires special handling because of
      // the call to signSessionWithAccount() earlier
      await onLogInWithAccount(primaryAccount, true);
    } catch (e) {
      console.log(e);
      notifyError('Unable to link account');
    }
  };

  // Handle saving profile information
  const onSaveProfileInfo = async (currentPrimaryAccount?: Account) => {
    const primaryAccountToUse = currentPrimaryAccount || primaryAccount;

    try {
      if (username || avatarUrl) {
        await updateProfile({
          address: primaryAccountToUse.profile.address,
          chain: primaryAccountToUse.profile.chain,
          name: username,
          avatarUrl,
        });
        // we should trigger a redraw emit manually
        NewProfilesController.Instance.isFetched.emit('redraw');
      }
      if (walletProps.onSuccess)
        walletProps.onSuccess(primaryAccountToUse.profile.address);
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
        w instanceof TerraWalletConnectWebWalletController,
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
    selectedAddress: string,
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
    selectedAddress: string,
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
                  10,
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
          'This address is already linked to another account. Signing will transfer ownership to your account.',
        );
      }
    }

    try {
      const sessionPublicAddress = await app.sessions.getOrCreateAddress(
        wallet.chain,
        wallet.getChainId().toString(),
        selectedAddress,
      );
      const chainIdentifier = app.chain?.id || wallet.defaultNetwork;

      let validationBlockInfo;
      try {
        validationBlockInfo =
          wallet.getRecentBlock &&
          (await wallet.getRecentBlock(chainIdentifier));
      } catch (err) {
        // if getRecentBlock fails, continue with null blockhash
      }

      const {
        account: signingAccount,
        newlyCreated,
        joinedCommunity,
      } = await createUserWithAddress(
        selectedAddress,
        wallet.name,
        null, // no sso source
        chainIdentifier,
        sessionPublicAddress,
        validationBlockInfo,
      );

      if (isMobile) {
        setSignerAccount(signingAccount);
        setIsNewlyCreated(newlyCreated);
        setIsLinkingOnMobile(isLinkingWallet);
        if (featureFlags.newSignInModal) {
          onAccountVerified(
            signingAccount,
            newlyCreated,
            isLinkingWallet,
            wallet,
          );
        } else {
          setActiveStep('redirectToSign');
        }
      } else {
        onAccountVerified(
          signingAccount,
          newlyCreated,
          isLinkingWallet,
          wallet,
        );
      }

      if (joinedCommunity) {
        trackAnalytics({
          event: MixpanelCommunityInteractionEvent.JOIN_COMMUNITY,
        });
      }

      trackAnalytics({
        event: MixpanelLoginEvent.LOGIN,
        community: app?.activeChainId(),
        communityType: app?.chain?.meta?.base,
        loginOption: wallet.name,
        isSocialLogin: true,
        loginPageLocation: isInCommunityPage ? 'community' : 'homepage',
        isMobile,
      });
      return;
    } catch (err) {
      console.log(err);
    }
  };

  const onSessionKeyRevalidation = async (
    wallet: IWebWallet<any>,
    selectedAddress: string,
  ) => {
    const timestamp = +new Date();
    const sessionAddress = await app.sessions.getOrCreateAddress(
      wallet.chain,
      wallet.getChainId().toString(),
      selectedAddress,
    );
    const chainIdentifier = app.chain?.id || wallet.defaultNetwork;
    let validationBlockInfo;
    try {
      validationBlockInfo = await wallet.getRecentBlock(chainIdentifier);
    } catch (err) {
      // if getRecentBlock fails, continue with null blockhash
    }

    // Start the create-user flow, so validationBlockInfo gets saved to the backend
    // This creates a new `Account` object with fields set up to be validated by verifyAddress.
    const { account } = await createUserWithAddress(
      selectedAddress,
      wallet.name,
      null, // no sso source?
      chainIdentifier,
      sessionAddress,
      validationBlockInfo,
    );
    account.setValidationBlockInfo(
      validationBlockInfo ? JSON.stringify(validationBlockInfo) : null,
    );

    const { chainId, sessionPayload, signature } = await signSessionWithAccount(
      wallet,
      account,
      timestamp,
    );
    await account.validate(signature, timestamp, chainId);
    await app.sessions.authSession(
      wallet.chain,
      chainId,
      account.address,
      sessionPayload,
      signature,
    );
    console.log('Started new session for', wallet.chain, chainId);

    // ensure false for newlyCreated / linking vars on revalidate
    if (isMobile) {
      if (setSignerAccount) setSignerAccount(account);
      if (setIsNewlyCreated) setIsNewlyCreated(false);
      if (setIsLinkingOnMobile) setIsLinkingOnMobile(false);
      if (featureFlags.newSignInModal) {
        onAccountVerified(account, false, false);
      } else {
        setActiveStep('redirectToSign');
      }
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
    onSocialLogin,
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
