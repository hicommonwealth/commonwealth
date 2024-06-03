/* eslint-disable react-hooks/exhaustive-deps */
import type { SessionPayload } from '@canvas-js/interfaces';
import { ChainBase, WalletSsoSource } from '@hicommonwealth/shared';
import axios from 'axios';
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
import { getAddressFromWallet, loginToNear } from '../helpers/wallet';
import Account from '../models/Account';
import IWebWallet from '../models/IWebWallet';
import {
  DISCOURAGED_NONREACTIVE_fetchProfilesByAddress,
  fetchProfilesByAddress,
} from '../state/api/profiles/fetchProfilesByAddress';
import { authModal } from '../state/ui/modals/authModal';
import { useBrowserAnalyticsTrack } from './useBrowserAnalyticsTrack';
import { useFlag } from './useFlag';

type LoginActiveStep =
  | 'redirectToSign'
  | 'selectAccountType'
  | 'selectPrevious'
  | 'selectProfile'
  | 'welcome';

type IuseWalletProps = {
  onSuccess?: (address?: string | undefined, isNewlyCreated?: boolean) => void;
  onModalClose: () => void;
  onUnrecognizedAddressReceived?: () => boolean;
  useSessionKeyLoginFlow?: boolean;
};

const useWallets = (walletProps: IuseWalletProps) => {
  const userOnboardingEnabled = useFlag('userOnboardingEnabled');
  const [username, setUsername] = useState<string>('Anonymous');
  const [email, setEmail] = useState<string>();
  const [wallets, setWallets] = useState<Array<IWebWallet<any>>>();
  const [selectedWallet, setSelectedWallet] = useState<IWebWallet<any>>();
  const [primaryAccount, setPrimaryAccount] = useState<Account>();
  const [isMagicLoading, setIsMagicLoading] = useState<boolean>();
  const [signerAccount, setSignerAccount] = useState<Account>(null);
  const [isNewlyCreated, setIsNewlyCreated] = useState<boolean>(false);
  const [isLinkingOnMobile, setIsLinkingOnMobile] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<LoginActiveStep>();
  const [isMobileWalletVerificationStep, setIsMobileWalletVerificationStep] =
    useState(false);

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

  useEffect(() => {
    if (process.env.ETH_RPC === 'e2e-test') {
      import('../helpers/mockMetaMaskUtil').then((f) => {
        window['ethereum'] = new f.MockMetaMaskProvider(
          'https://eth-mainnet.g.alchemy.com/v2/pZsX6R3wGdnwhUJHlVmKg4QqsiS32Qm4',
          '0x09187906d2ff8848c20050df632152b5b27d816ec62acd41d4498feb522ac5c3',
        );
      });
    }

    // if in a community, display wallets for that community
    if (app.activeChainId()) {
      const chainbase = app.chain?.base;
      setWallets(WebWalletController.Instance.availableWallets(chainbase));
    } else {
      const sortedChainBases = [
        ChainBase.CosmosSDK,
        ChainBase.Ethereum,
        // ChainBase.NEAR,
        ChainBase.Substrate,
        ChainBase.Solana,
      ];
      setWallets(
        _.flatten(
          sortedChainBases.map((base) => {
            return WebWalletController.Instance.availableWallets(base);
          }),
        ),
      );
    }
  }, []);

  useEffect(() => {
    setIsMobileWalletVerificationStep(
      isMobile && activeStep === 'redirectToSign',
    );
  }, [isMobile, activeStep]);

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
      const isAttemptingToConnectAddressToCommunity =
        app.isLoggedIn() && app.activeChainId();
      const { address: magicAddress, isAddressNew } =
        await startLoginWithMagicLink({
          email: tempEmailToUse,
          isCosmos,
          redirectTo: document.location.pathname + document.location.search,
          chain: app.chain?.id,
        });
      setIsMagicLoading(false);

      // if SSO account address is not already present in db,
      // and `shouldOpenGuidanceModalAfterMagicSSORedirect` is `true`,
      // and the user isn't trying to link address to community,
      // then open the user auth type guidance modal
      // else clear state of `shouldOpenGuidanceModalAfterMagicSSORedirect`
      if (
        userOnboardingEnabled &&
        isAddressNew &&
        !isAttemptingToConnectAddressToCommunity &&
        !app.isLoggedIn()
      ) {
        authModal
          .getState()
          .validateAndOpenAuthTypeGuidanceModalOnSSORedirectReceived();
        return;
      }

      walletProps?.onSuccess?.(magicAddress, isNewlyCreated);
      walletProps?.onModalClose?.();

      trackAnalytics({
        event: MixpanelLoginEvent.LOGIN,
        community: app?.activeChainId(),
        communityType: app?.chain?.meta?.base,
        loginOption: 'email',
        isSocialLogin: true,
        loginPageLocation: app.activeChainId() ? 'community' : 'homepage',
        isMobile,
      });
    } catch (e) {
      notifyError(`Error authenticating with email`);
      console.error(`Error authenticating with email: ${e}`);
      setIsMagicLoading(false);
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

      walletProps?.onSuccess?.(magicAddress, isNewlyCreated);
      walletProps?.onModalClose?.();

      trackAnalytics({
        event: MixpanelLoginEvent.LOGIN,
        community: app?.activeChainId(),
        communityType: app?.chain?.meta?.base,
        loginOption: provider,
        isSocialLogin: true,
        loginPageLocation: app.activeChainId() ? 'community' : 'homepage',
        isMobile,
      });
    } catch (e) {
      notifyError(`Error authenticating with sso account`);
      console.error(`Error authenticating with sso account: ${e}`);
      setIsMagicLoading(false);
    }
  };

  // Performs Login on the client
  const onLogInWithAccount = async (
    account: Account,
    exitOnComplete: boolean,
    newelyCreated = false,
    shouldRedrawApp = true,
  ) => {
    const profile = account.profile;

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
          app.user.selectedCommunity ||
          app.config.chains.getById(app.activeChainId());
        await updateActiveAddresses({
          chain: community,
          shouldRedraw: shouldRedrawApp,
        });
      }
    }

    if (exitOnComplete) {
      walletProps?.onModalClose?.();
      walletProps?.onSuccess?.(account.address, newelyCreated);
    }
  };

  // Handle branching logic after wallet is selected
  const onAccountVerified = async (
    account: Account,
    newlyCreated: boolean,
    linking: boolean,
    wallet?: IWebWallet<any>,
  ) => {
    if (walletProps.useSessionKeyLoginFlow) {
      walletProps?.onSuccess?.(account.address, newlyCreated);
      return;
    }

    const walletToUse = wallet || selectedWallet;

    // Handle Logged in and joining community of different chain base
    if (app.activeChainId() && app.isLoggedIn()) {
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
      await onLogInWithAccount(account, true, newlyCreated);
      return;
    }

    // Handle Linking vs New Account cases
    if (!linking) {
      setPrimaryAccount(account);
    } else {
      if (newlyCreated) {
        notifyError("This account doesn't exist");
        return;
      }
      if (account.address === primaryAccount.address) {
        notifyError("You can't link to the same account");
        return;
      }
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
        await onLogInWithAccount(account, true, newlyCreated);
      } catch (e) {
        notifyError(`Error verifying account`);
        console.error(`Error verifying account: ${e}`);
      }
    } else {
      if (linking) {
        setActiveStep('selectProfile');
        return;
      }

      try {
        const timestamp = +new Date();
        const { signature, chainId, sessionPayload } =
          await signSessionWithAccount(walletToUse, account, timestamp);
        // Can't call authSession now, since chain.base is unknown, so we wait till action
        walletProps.onSuccess?.(account.address, newlyCreated);
        setActiveStep('selectAccountType');

        // Create the account with default values
        await onCreateNewAccount(
          walletToUse,
          signature,
          timestamp,
          chainId,
          sessionPayload,
          account,
        );
        await onSaveProfileInfo(account, newlyCreated);
      } catch (e) {
        notifyError(`Error verifying account`);
        console.error(`Error verifying account: ${e}`);
      }
    }
  };

  // Handle Logic for creating a new account, including validating signature
  const onCreateNewAccount = async (
    wallet?: IWebWallet<any>,
    walletSignature?: string,
    cachedTimestamp?: number,
    cachedChainId?: string,
    cachedSessionPayload?: SessionPayload,
    account?: Account,
  ) => {
    const walletToUse = wallet || selectedWallet;

    try {
      if (walletToUse.chain !== 'near') {
        await account.validate(
          walletSignature,
          cachedTimestamp,
          cachedChainId,
          false,
        );
        await app.sessions.authSession(
          walletToUse.chain,
          cachedChainId,
          account.address,
          cachedSessionPayload,
          walletSignature,
        );
      }
      await onLogInWithAccount(account, false, true, false);
      // Important: when we first create an account and verify it, the user id
      // is initially null from api (reloading the page will update it), to correct
      // it we need to get the id from api
      const updatedProfiles =
        await DISCOURAGED_NONREACTIVE_fetchProfilesByAddress(
          account.profile.chain,
          account.profile.address,
        );
      const currentUserUpdatedProfile = updatedProfiles[0];
      if (!currentUserUpdatedProfile) {
        console.log('No profile yet.');
      } else {
        account.profile.initialize(
          currentUserUpdatedProfile?.name,
          currentUserUpdatedProfile.address,
          currentUserUpdatedProfile?.avatarUrl,
          currentUserUpdatedProfile.id,
          account.profile.chain,
          currentUserUpdatedProfile?.lastActive,
        );
      }
    } catch (e) {
      notifyError(`Error creating account. Please try again.`);
      console.error(`Error creating account: ${e}`);
      walletProps?.onModalClose?.();
    }
    setActiveStep('welcome');
  };

  // Handle saving profile information
  const onSaveProfileInfo = async (
    account?: Account,
    newelyCreated?: boolean,
  ) => {
    try {
      if (username) {
        await updateProfile({
          address: account.profile.address,
          chain: account.profile.chain,
          name: username,
        });
        // we should trigger a redraw emit manually
        NewProfilesController.Instance.isFetched.emit('redraw');
      }
      walletProps?.onSuccess?.(account.profile.address, newelyCreated);
      app.loginStateEmitter.emit('redraw'); // redraw app state when fully onboarded with new account
    } catch (e) {
      notifyError('Failed to save profile info');
      console.error(`Failed to save profile info: ${e}`);
    }
    walletProps?.onModalClose?.();
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
      // TODO: remove this
    } else {
      setSelectedWallet(wallet);
    }

    if (wallet.chain === 'near') {
      await loginToNear(app.chain as Near, app.isCustomDomain());
    } else {
      const selectedAddress = getAddressFromWallet(wallet);

      if (userOnboardingEnabled) {
        // check if address exists
        const profileAddresses = await fetchProfilesByAddress({
          currentChainId: '',
          profileAddresses: [
            wallet.chain === ChainBase.Substrate
              ? addressSwapper({
                  address: selectedAddress,
                  currentPrefix: parseInt(
                    (app.chain as Substrate)?.meta.ss58Prefix,
                    10,
                  ),
                })
              : selectedAddress,
          ],
          profileChainIds: [app.activeChainId() ?? wallet.chain],
          initiateProfilesAfterFetch: false,
        });
        const addressExists = profileAddresses?.length > 0;
        const isAttemptingToConnectAddressToCommunity =
          app.isLoggedIn() && app.activeChainId();
        if (
          !addressExists &&
          !isAttemptingToConnectAddressToCommunity &&
          walletProps.onUnrecognizedAddressReceived
        ) {
          const shouldContinue = walletProps.onUnrecognizedAddressReceived();
          if (!shouldContinue) return;
        }
      }

      if (walletProps.useSessionKeyLoginFlow) {
        await onSessionKeyRevalidation(wallet, selectedAddress);
      } else {
        await onNormalWalletLogin(wallet, selectedAddress);
      }
    }
  };

  const onWalletAddressSelect = async (
    wallet: IWebWallet<any>,
    address: string,
  ) => {
    setSelectedWallet(wallet);
    if (walletProps.useSessionKeyLoginFlow) {
      await onSessionKeyRevalidation(wallet, address);
    } else {
      await onNormalWalletLogin(wallet, address);
    }
  };

  const getWalletRecentBlock = async (
    wallet: IWebWallet<any>,
    chain: string,
  ) => {
    try {
      if (!wallet.getRecentBlock) return;
      return await wallet?.getRecentBlock?.(chain);
    } catch (err) {
      // if getRecentBlock fails, continue with null blockhash
      console.error(`Error getting recent validation block: ${err}`);
      return;
    }
  };

  const onNormalWalletLogin = async (
    wallet: IWebWallet<any>,
    address: string,
  ) => {
    setSelectedWallet(wallet);

    if (app.isLoggedIn()) {
      try {
        const res = await axios.post(`${app.serverUrl()}/getAddressStatus`, {
          address:
            wallet.chain === ChainBase.Substrate
              ? addressSwapper({
                  address: address,
                  currentPrefix: parseInt(
                    (app.chain as Substrate)?.meta.ss58Prefix,
                    10,
                  ),
                })
              : address,
          community_id: app.activeChainId() ?? wallet.chain,
          jwt: app.user.jwt,
        });

        if (res.data.result.exists && res.data.result.belongsToUser) {
          notifyInfo('This address is already linked to your current account.');
          return;
        }

        if (res.data.result.exists) {
          notifyInfo(
            'This address is already linked to another account. Signing will transfer ownership to your account.',
          );
        }
      } catch (err) {
        notifyError(`Error getting address status`);
        console.error(`Error getting address status: ${err}`);
      }
    }

    try {
      const sessionPublicAddress = await app.sessions.getOrCreateAddress(
        wallet.chain,
        wallet.getChainId().toString(),
        address,
      );
      const chainIdentifier = app.chain?.id || wallet.defaultNetwork;

      const validationBlockInfo = await getWalletRecentBlock(
        wallet,
        chainIdentifier,
      );

      const {
        account: signingAccount,
        newlyCreated,
        joinedCommunity,
      } = await createUserWithAddress(
        address,
        wallet.name,
        null, // no sso source
        chainIdentifier,
        sessionPublicAddress,
        validationBlockInfo,
      );

      setIsNewlyCreated(newlyCreated);
      if (isMobile) {
        setSignerAccount(signingAccount);
        setIsLinkingOnMobile(isLinkingWallet);
        setActiveStep('redirectToSign');
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
        loginPageLocation: app.activeChainId() ? 'community' : 'homepage',
        isMobile,
      });
      return;
    } catch (err) {
      notifyError(`Error authenticating with wallet`);
      console.error(`Error authenticating with wallet: ${err}`);
    }
  };

  const onSessionKeyRevalidation = async (
    wallet: IWebWallet<any>,
    address: string,
  ) => {
    const timestamp = +new Date();
    const sessionAddress = await app.sessions.getOrCreateAddress(
      wallet.chain,
      wallet.getChainId().toString(),
      address,
    );
    const chainIdentifier = app.chain?.id || wallet.defaultNetwork;
    const validationBlockInfo = await getWalletRecentBlock(
      wallet,
      chainIdentifier,
    );

    // Start the create-user flow, so validationBlockInfo gets saved to the backend
    // This creates a new `Account` object with fields set up to be validated by verifyAddress.
    const { account } = await createUserWithAddress(
      address,
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
      setActiveStep('redirectToSign');
    } else {
      onAccountVerified(account, false, false);
    }
  };

  const onVerifyMobileWalletSignature = async () => {
    await onAccountVerified(
      signerAccount,
      isNewlyCreated,
      isLinkingWallet,
      selectedWallet,
    );
    setIsMobileWalletVerificationStep(false);
    walletProps?.onModalClose?.();
  };

  return {
    wallets,
    isMagicLoading,
    isLinkingOnMobile,
    isWalletConnectEnabled,
    isMobileWalletVerificationStep,
    onWalletAddressSelect,
    onWalletSelect,
    onResetWalletConnect,
    onEmailLogin,
    onSocialLogin,
    setEmail,
    onVerifyMobileWalletSignature,
  };
};

export default useWallets;
