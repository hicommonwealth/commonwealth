import type { Session } from '@canvas-js/interfaces';
import {
  ChainBase,
  DEFAULT_NAME,
  WalletId,
  WalletSsoSource,
  addressSwapper,
  verifySession,
} from '@hicommonwealth/shared';
import { useLoginWithEmail, useLoginWithSms } from '@privy-io/react-auth';
import axios from 'axios';
import { useFlag } from 'client/scripts/hooks/useFlag';
import { BASE_API_PATH } from 'client/scripts/utils/trpcClient';
import {
  completeClientLogin,
  setActiveAccount,
  startLoginWithMagicLink,
  updateActiveAddresses,
} from 'controllers/app/login';
import {
  notifyError,
  notifyInfo,
  notifySuccess,
} from 'controllers/app/notifications';
import FarcasterWebWalletController from 'controllers/app/webWallets/farcaster_web_wallet';
import TerraWalletConnectWebWalletController from 'controllers/app/webWallets/terra_walletconnect_web_wallet';
import WalletConnectWebWalletController from 'controllers/app/webWallets/walletconnect_web_wallet';
import WebWalletController from 'controllers/app/web_wallets';
import type Substrate from 'controllers/chain/substrate/adapter';
import {
  getSessionFromWallet,
  signSessionWithAccount,
} from 'controllers/server/sessions';
import {
  LocalStorageKeys,
  getLocalStorageItem,
  removeLocalStorageItem,
} from 'helpers/localStorage';
import _ from 'lodash';
import { Magic } from 'magic-sdk';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useLocation, useSearchParams } from 'react-router-dom';
import app, { initAppState } from 'state';
import useFetchPublicEnvVarQuery from 'state/api/configuration/fetchPublicEnvVar';
import { fetchProfilesByAddress } from 'state/api/profiles/fetchProfilesByAddress';
import { useSignIn, useUpdateUserMutation } from 'state/api/user';
import useUserStore from 'state/ui/user';
import { EIP1193Provider } from 'viem';
import usePrivyEmailDialogStore, {
  emailDialogStore,
} from 'views/components/Privy/stores/usePrivyEmailDialogStore';
import { smsDialogStore } from 'views/components/Privy/stores/usePrivySMSDialogStore';
import type { PrivySignInSSOProvider } from 'views/components/Privy/types';
import { OAuthProvider } from 'views/components/Privy/types';
import { useConnectedWallet } from 'views/components/Privy/useConnectedWallet';
import { usePrivySignOn } from 'views/components/Privy/usePrivySignOn';
import { PrivyAuth } from 'views/modals/AuthModal/PrivyAuth';
import {
  BaseMixpanelPayload,
  MixpanelCommunityInteractionEvent,
  MixpanelLoginEvent,
  MixpanelLoginPayload,
} from '../../../../../shared/analytics/types';
import NewProfilesController from '../../../controllers/server/newProfiles';
import { getAddressFromWallet } from '../../../helpers/wallet';
import useAppStatus from '../../../hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from '../../../hooks/useBrowserAnalyticsTrack';
import Account from '../../../models/Account';
import IWebWallet from '../../../models/IWebWallet';
import { waitForWallet } from '../../components/Privy/helpers';
import { openConfirmation } from '../confirmation_modal';

type UseAuthenticationProps = {
  onSuccess?: (
    address?: string | null | undefined,
    isNewlyCreated?: boolean,
    isUserFromWebView?: boolean,
  ) => Promise<void>;
  onModalClose?: () => void;
  withSessionKeyLoginFlow?: boolean;
  isUserFromWebView?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Wallet = IWebWallet<any>;

const useAuthentication = (props: UseAuthenticationProps) => {
  const [username, setUsername] = useState<string>(DEFAULT_NAME);
  const [email, setEmail] = useState<string>();
  const [SMS, setSMS] = useState<string>();
  const [wallets, setWallets] = useState<Array<Wallet>>();
  const [selectedWallet, setSelectedWallet] = useState<Wallet>();
  const [primaryAccount, setPrimaryAccount] = useState<Account>();
  const [isMagicLoading, setIsMagicLoading] = useState<boolean>();
  // @ts-expect-error <StrictNullChecks>
  const [signerAccount, setSignerAccount] = useState<Account>(null);
  const [isNewlyCreated, setIsNewlyCreated] = useState<boolean>(false);
  const [isMobileWalletVerificationStep, setIsMobileWalletVerificationStep] =
    useState(false);
  const privyEnabled = useFlag('privy');

  const { isAddedToHomeScreen } = useAppStatus();
  const { setState: setEmailDialogState } = usePrivyEmailDialogStore();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const user = useUserStore();
  const { data: configurationData } = useFetchPublicEnvVarQuery();

  // Privy hooks for SMS authentication
  const connectedWallet = useConnectedWallet();
  const privySignOn = usePrivySignOn();
  const connectedWalletRef = useRef(connectedWallet);

  // Update wallet ref when wallet changes
  useEffect(() => {
    connectedWalletRef.current = connectedWallet;
  }, [connectedWallet]);

  const magic = new Magic(configurationData!.MAGIC_PUBLISHABLE_KEY);

  const isWalletConnectEnabled = _.some(
    wallets,
    (w) =>
      (w instanceof WalletConnectWebWalletController ||
        w instanceof TerraWalletConnectWebWalletController) &&
      w.enabled,
  );

  const { trackAnalytics } = useBrowserAnalyticsTrack<
    MixpanelLoginPayload | BaseMixpanelPayload
  >({
    onAction: true,
  });

  const { mutateAsync: updateUser } = useUpdateUserMutation();
  const { signIn } = useSignIn();

  const handlePrivySuccess = useCallback(() => {
    const landingURL = new URL(
      '/dashboard/for-you',
      window.location.href,
    ).toString();
    document.location.href = landingURL;
  }, []);

  const handlePrivyError = useCallback((err: Error) => {
    console.log('privy error: ', err);
    setIsMagicLoading(false);
  }, []);

  const privyCallbacks = useMemo(() => {
    return {
      onSuccess: handlePrivySuccess,
      onError: handlePrivyError,
    };
  }, [handlePrivyError, handlePrivySuccess]);

  const privyAuthWithOAuth = privyEnabled && PrivyAuth(privyCallbacks);

  // Handle SMS login completion (similar to OAuth pattern)
  const handleSMSLoginComplete = useCallback(async () => {
    if (user.isLoggedIn) return;

    // Wait for wallet to be available
    const walletAvailable = await waitForWallet(connectedWalletRef);
    if (!walletAvailable) {
      handlePrivyError(new Error('Wallet not available'));
      return;
    }

    const currentWallet = connectedWalletRef.current;
    if (!currentWallet) {
      console.warn('No connected wallet available');
      handlePrivyError(new Error('No connected wallet available'));
      return;
    }

    try {
      await privySignOn({
        wallet: currentWallet,
        onSuccess: handlePrivySuccess,
        onError: handlePrivyError,
        ssoOAuthToken: undefined, // Not needed for SMS
        ssoProvider: 'phone' as PrivySignInSSOProvider, // SMS provider
      });
    } catch (error) {
      console.error('SMS sign-on error:', error);
      handlePrivyError(error as Error);
    }
  }, [
    user.isLoggedIn,
    connectedWalletRef,
    privySignOn,
    handlePrivySuccess,
    handlePrivyError,
  ]);

  const handleEmailLoginComplete = useCallback(async () => {
    if (user.isLoggedIn) return;

    // Wait for wallet to be available
    const walletAvailable = await waitForWallet(connectedWalletRef);
    if (!walletAvailable) {
      handlePrivyError(new Error('Wallet not available'));
      return;
    }

    const currentWallet = connectedWalletRef.current;
    if (!currentWallet) {
      console.warn('No connected wallet available');
      handlePrivyError(new Error('No connected wallet available'));
      return;
    }

    try {
      await privySignOn({
        wallet: currentWallet,
        onSuccess: handlePrivySuccess,
        onError: handlePrivyError,
        ssoOAuthToken: undefined, // Not needed for email
        ssoProvider: 'email' as PrivySignInSSOProvider, // Email provider
      });
    } catch (error) {
      console.error('Email sign-on error:', error);
      handlePrivyError(error as Error);
    }
  }, [
    user.isLoggedIn,
    connectedWalletRef,
    privySignOn,
    handlePrivySuccess,
    handlePrivyError,
  ]);

  const { sendCode: sendSMSCode, loginWithCode: loginWithSMSCode } =
    useLoginWithSms({
      onComplete: () => {
        handleSMSLoginComplete().catch(console.error);
      },
    });

  const { sendCode: sendEmailCode, loginWithCode: loginWithEmailCode } =
    useLoginWithEmail({
      onComplete: () => {
        handleEmailLoginComplete().catch(console.error);
      },
    });

  const refcode = getLocalStorageItem(LocalStorageKeys.ReferralCode);

  useEffect(() => {
    if (configurationData!.TEST_EVM_ETH_RPC === 'e2e-test') {
      import('../../../helpers/mockMetaMaskUtil')
        .then((f) => {
          window['ethereum'] = new f.MockMetaMaskProvider(
            `https://eth-mainnet.g.alchemy.com/v2/${configurationData!.ALCHEMY_PUBLIC_APP_KEY}`,
            '0x09187906d2ff8848c20050df632152b5b27d816ec62acd41d4498feb522ac5c3',
          ) as unknown as EIP1193Provider;
        })
        .catch(console.error);
    }

    // if in a community, display wallets for that community
    if (app.activeChainId()) {
      const chainbase = app.chain?.base;
      setWallets(WebWalletController.Instance.availableWallets(chainbase));
    } else {
      const sortedChainBases = [
        ChainBase.CosmosSDK,
        ChainBase.Ethereum,
        ChainBase.Substrate,
        ChainBase.Solana,
        ChainBase.Sui,
      ];
      setWallets(
        _.flatten(
          sortedChainBases.map((base) =>
            WebWalletController.Instance.availableWallets(base),
          ),
        ),
      );
    }
  }, [configurationData]);

  useEffect(() => {
    const actualUrl = new URL(window.location.href);
    const hasPrivyOAuthState = actualUrl.searchParams.has('privy_oauth_state');
    setIsMagicLoading(hasPrivyOAuthState);
  }, [searchParams, location]);

  const handleSuccess = async (
    authAddress?: string | null | undefined,
    isNew?: boolean,
    isUserFromWebView?: boolean,
  ) => {
    removeLocalStorageItem(LocalStorageKeys.ReferralCode);
    await props?.onSuccess?.(authAddress, isNew, isUserFromWebView);
  };

  const trackLoginEvent = (loginOption: string, isSocialLogin: boolean) => {
    trackAnalytics({
      event: MixpanelLoginEvent.LOGIN,
      community: app?.activeChainId(),
      communityType: app?.chain?.meta?.base,
      loginOption: loginOption,
      isSocialLogin: isSocialLogin,
      loginPageLocation: app.activeChainId() ? 'community' : 'homepage',
      isMobile,
      isPWA: isAddedToHomeScreen,
    });
  };

  // Handles Magic Link Login
  const onSMSLoginMagic = async (phoneNumber = '') => {
    const tempSMSToUse = phoneNumber || SMS;
    setSMS(tempSMSToUse);

    setIsMagicLoading(true);

    if (!phoneNumber) {
      notifyError('Please enter a valid phone number.');
      setIsMagicLoading(false);
      return;
    }

    try {
      const isCosmos = app.chain?.base === ChainBase.CosmosSDK;
      const { address: magicAddress } = await startLoginWithMagicLink({
        phoneNumber: tempSMSToUse,
        isCosmos,
        chain: app.chain?.id,
        referrer_address: refcode,
      });
      setIsMagicLoading(false);

      await handleSuccess(magicAddress, isNewlyCreated);
      props?.onModalClose?.();

      trackLoginEvent('SMS', true);
    } catch (e) {
      notifyError(`Error authenticating with SMS`);
      console.error(`Error authenticating with SMS: ${e}`);
      setIsMagicLoading(false);
    }
  };

  const onSMSLoginPrivy = async (phoneNumber) => {
    setIsMagicLoading(true);
    const tempSMSToUse = phoneNumber || SMS;
    setSMS(tempSMSToUse);

    try {
      await sendSMSCode({ phoneNumber: tempSMSToUse });

      const { awaitUserInput } = smsDialogStore.getState();
      const code = await awaitUserInput('Enter the code we sent to your phone');

      await loginWithSMSCode({ code });

      setIsMagicLoading(false);
    } catch (error) {
      // Handle both cancellation and actual errors
      if (error.message === 'User cancelled') {
        console.log('User cancelled SMS verification');
      } else {
        console.error('SMS login error:', error);
        notifyError('Error during SMS verification. Please try again.');
      }
      setSMS(undefined);
      setIsMagicLoading(false);
    }
  };

  const onSMSLogin = privyEnabled ? onSMSLoginPrivy : onSMSLoginMagic;

  const onEmailLoginMagic = async (emailToUse = '') => {
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
        chain: app.chain?.id,
        referrer_address: refcode,
      });
      setIsMagicLoading(false);

      await handleSuccess(magicAddress, isNewlyCreated);
      props?.onModalClose?.();

      trackLoginEvent('email', true);
    } catch (e) {
      notifyError(`Error authenticating with email`);
      console.error(`Error authenticating with email: ${e}`);
      setIsMagicLoading(false);
    }
  };

  const onEmailLoginPrivy = async (emailToUse = '') => {
    const tempEmailToUse = emailToUse || email;
    setEmail(tempEmailToUse);

    setIsMagicLoading(true);

    if (!tempEmailToUse) {
      notifyError('Please enter a valid email address.');
      setIsMagicLoading(false);
      return;
    }

    try {
      await sendEmailCode({ email: tempEmailToUse });
      const { awaitUserInput } = emailDialogStore.getState();
      const code = await awaitUserInput();
      await loginWithEmailCode({ code });
      setIsMagicLoading(false);
    } catch (e) {
      notifyError(`Error authenticating with email`);
      console.error(`Error authenticating with email: ${e}`);
      setEmail(undefined);
      setIsMagicLoading(false);
    }
  };

  const onEmailLogin = privyEnabled ? onEmailLoginPrivy : onEmailLoginMagic;

  // New callback for handling social login
  const onSocialLoginMagic = async (provider: WalletSsoSource) => {
    setIsMagicLoading(true);

    try {
      const isCosmos = app?.chain?.base === ChainBase.CosmosSDK;
      const { address: magicAddress } = await startLoginWithMagicLink({
        provider,
        isCosmos,
        chain: app.chain?.id,
        referrer_address: refcode,
      });
      setIsMagicLoading(false);

      await handleSuccess(magicAddress, isNewlyCreated);
      props?.onModalClose?.();

      trackLoginEvent(provider, true);
    } catch (e) {
      notifyError(`Error authenticating with sso account`);
      console.error(`Error authenticating with sso account: ${e}`);
      setIsMagicLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/require-await
  const onSocialLoginPrivy = async (provider: WalletSsoSource) => {
    setIsMagicLoading(true);
    console.log('onSocialLoginPrivy: ' + provider);
    if (privyAuthWithOAuth) {
      privyAuthWithOAuth.onInitOAuth(provider as OAuthProvider);
    }
  };

  const onSocialLogin = privyEnabled ? onSocialLoginPrivy : onSocialLoginMagic;

  // Performs Login on the client
  const onLogInWithAccount = async (
    account: Account,
    exitOnComplete: boolean,
    newelyCreated = false,
    isUserFromWebView = false,
  ) => {
    const profile = account.profile;

    // @ts-expect-error <StrictNullChecks>
    if (profile.name && profile.initialized) {
      // @ts-expect-error <StrictNullChecks>
      setUsername(profile.name);
    }

    if (user.isLoggedIn) {
      await completeClientLogin(account);
    } else {
      // log in as the new user
      await initAppState(false);
      if (app.chain) {
        await updateActiveAddresses(app.activeChainId() || '');
      }
    }

    removeLocalStorageItem(LocalStorageKeys.ReferralCode);

    if (exitOnComplete) {
      props?.onModalClose?.();
      await handleSuccess(account.address, newelyCreated, isUserFromWebView);
    }
  };

  // Handle branching logic after wallet is selected
  const onAccountVerified = async (
    account: Account,
    newlyCreated: boolean,
    linking: boolean,
    wallet?: Wallet,
  ) => {
    if (props.withSessionKeyLoginFlow) {
      await setActiveAccount(account);
      notifySuccess('Account verified!');
      await handleSuccess(
        account.address,
        newlyCreated,
        props.isUserFromWebView,
      );
      return;
    }

    const walletToUse = wallet || selectedWallet;

    // Handle Logged in and joining community of different chain base
    if (app.activeChainId() && user.isLoggedIn) {
      // @ts-expect-error StrictNullChecks
      const session = await getSessionFromWallet(walletToUse);
      await signIn(session, {
        community_id: account.community.id,
        address: account.address,
        wallet_id: account.walletId!,
        block_info: account.validationBlockInfo,
        referrer_address: refcode,
      });
      await onLogInWithAccount(
        account,
        true,
        newlyCreated,
        props.isUserFromWebView,
      );
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
      // @ts-expect-error <StrictNullChecks>
      if (account.address === primaryAccount.address) {
        notifyError("You can't link to the same account");
        return;
      }
    }

    // Handle receiving and caching wallet signature strings
    if (!newlyCreated && !linking) {
      try {
        // @ts-expect-error StrictNullChecks
        const session = await getSessionFromWallet(walletToUse);
        await signIn(session, {
          community_id: account.community.id,
          address: account.address,
          wallet_id: account.walletId!,
          block_info: account.validationBlockInfo,
          referrer_address: refcode,
        });
        await onLogInWithAccount(
          account,
          true,
          newlyCreated,
          props.isUserFromWebView,
        );
      } catch (e) {
        notifyError(`Error verifying account`);
        console.error(`Error verifying account: ${e}`);
      }
    } else {
      if (linking) return;

      try {
        // @ts-expect-error StrictNullChecks
        const session = await signSessionWithAccount(walletToUse, account);
        // Can't call authSession now, since chain.base is unknown, so we wait till action
        await props.onSuccess?.(account.address, newlyCreated);

        // Create the account with default values
        // await onCreateNewAccount(walletToUse, session, account);
        await onCreateNewAccount(session, account);
        await onSaveProfileInfo(account, newlyCreated);
      } catch (e) {
        notifyError(`Error verifying account`);
        console.error(`Error verifying account: ${e}`);
      }
    }
  };

  // Handle Logic for creating a new account, including validating signature
  const onCreateNewAccount = async (session?: Session, account?: Account) => {
    try {
      if (session && account)
        await signIn(session, {
          address: account.address,
          community_id: account.community.id,
          wallet_id: account.walletId!,
          block_info: account.validationBlockInfo,
          referrer_address: refcode,
        });
      // @ts-expect-error StrictNullChecks
      await verifySession(session);
      // @ts-expect-error <StrictNullChecks>
      await onLogInWithAccount(account, false, true);
      // Important: when we first create an account and verify it, the user id
      // is initially null from api (reloading the page will update it), to correct
      // it we need to get the id from api

      const userAddresses = await fetchProfilesByAddress(
        [account!.profile!.chain],
        [account!.profile!.address],
      );

      const currentUserAddress = userAddresses?.[0];
      if (!currentUserAddress) {
        console.log('No profile yet.');
      } else {
        account?.profile?.initialize(
          currentUserAddress.userId,
          currentUserAddress.name,
          currentUserAddress.address,
          currentUserAddress.avatarUrl ?? '',
          account?.profile?.chain,
          new Date(currentUserAddress.lastActive ?? ''),
          0,
        );
      }
    } catch (e) {
      console.log(e);
      notifyError('Failed to create account. Please try again.');
    }
  };

  // Handle saving profile information
  const onSaveProfileInfo = async (
    account?: Account,
    newelyCreated?: boolean,
  ) => {
    try {
      if (username !== DEFAULT_NAME && account?.profile) {
        await updateUser({
          id: account.profile.userId,
          profile: {
            name: username.trim(),
          },
        });
        // we should trigger a redraw emit manually
        NewProfilesController.Instance.isFetched.emit('redraw');
      }
      // @ts-expect-error <StrictNullChecks>
      await handleSuccess(account.profile.address, newelyCreated);
    } catch (e) {
      notifyError('Failed to save profile info');
      console.error(`Failed to save profile info: ${e}`);
    }
    props?.onModalClose?.();
  };

  const onResetWalletConnect = async () => {
    // @ts-expect-error <StrictNullChecks>
    const wallet = wallets.find(
      (w) =>
        w instanceof WalletConnectWebWalletController ||
        w instanceof TerraWalletConnectWebWalletController,
    );

    // @ts-expect-error <StrictNullChecks>
    await wallet.reset();
  };

  const onWalletSelect = async (wallet: Wallet) => {
    try {
      await wallet.enable();
    } catch (error) {
      notifyError(error?.message || error);
      return;
    }
    setSelectedWallet(wallet);

    const selectedAddress = getAddressFromWallet(wallet);
    if (!selectedAddress) {
      notifyError(
        `We couldn't fetch an address from your wallet! Please make sure your wallet account is setup and try again`,
      );
      return;
    }

    if (props.withSessionKeyLoginFlow) {
      await onSessionKeyRevalidation(wallet, selectedAddress);
    } else {
      await onNormalWalletLogin(wallet, selectedAddress);
    }
  };

  const onWalletAddressSelect = async (wallet: Wallet, address: string) => {
    setSelectedWallet(wallet);
    if (props.withSessionKeyLoginFlow) {
      await onSessionKeyRevalidation(wallet, address);
    } else {
      await onNormalWalletLogin(wallet, address);
    }
  };

  const getWalletRecentBlock = async (wallet: Wallet, chain: string) => {
    try {
      if (!wallet.getRecentBlock) return;
      return await wallet?.getRecentBlock?.(chain);
    } catch (err) {
      // if getRecentBlock fails, continue with null blockhash
      console.error(`Error getting recent validation block: ${err}`);
    }
  };

  const handleWalletTransfer = async (wallet: Wallet, address: string) => {
    try {
      const session = await getSessionFromWallet(wallet, { newSession: true });
      const chainIdentifier = app.chain?.id || wallet.defaultNetwork;
      const validationBlockInfo = await getWalletRecentBlock(
        wallet,
        chainIdentifier,
      );

      const {
        account: signingAccount,
        newlyCreated,
        joinedCommunity,
      } = await signIn(session, {
        address,
        community_id: chainIdentifier,
        wallet_id: wallet.name,
        block_info: validationBlockInfo
          ? JSON.stringify(validationBlockInfo)
          : null,
        referrer_address: refcode,
      });
      setIsNewlyCreated(newlyCreated);
      if (isMobile) {
        setSignerAccount(signingAccount);
        if (window?.ethereum?.isBinance) {
          // for binance wallet we don't need to show the verification modal/step
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          setIsMobileWalletVerificationStep(true);
        }
      } else {
        await onAccountVerified(signingAccount, newlyCreated, false, wallet);
      }

      if (joinedCommunity) {
        trackAnalytics({
          event: MixpanelCommunityInteractionEvent.JOIN_COMMUNITY,
          isPWA: isAddedToHomeScreen,
        });
      }

      trackLoginEvent(wallet.name, true);
    } catch (err) {
      notifyError(`Error authenticating with wallet`);
      console.error(`Error authenticating with wallet: ${err}`);
    }
  };
  const onNormalWalletLogin = async (wallet: Wallet, address: string) => {
    setSelectedWallet(wallet);

    if (user.isLoggedIn) {
      try {
        const cid = app.activeChainId() ?? wallet.chain;
        const adr =
          wallet.chain === ChainBase.Substrate
            ? addressSwapper({
                address,
                currentPrefix: parseInt(
                  `${(app.chain as Substrate)?.meta.ss58_prefix || 0}`,
                  10,
                ),
              })
            : address;
        const { data } = await axios.get(
          `${BASE_API_PATH}/user.getAddressStatus?community_id=${cid}&address=${adr}`,
          { headers: { address: user.activeAccount?.address, jwt: user.jwt } },
        );

        if (data.exists && data.belongs_to_user) {
          notifyInfo('This address is already linked to your current account.');
          return;
        }

        if (data.exists) {
          openConfirmation({
            title: 'Wallet Transfer Confirmation',
            description: `
            The wallet you want to link is owned by account Y. 
            Do you want to transfer it? Your thread history will
            now be associated with account X.
            `,
            buttons: [
              {
                label: 'Confirm Transfer',
                buttonType: 'destructive',
                buttonHeight: 'sm',
                onClick: () => {
                  void handleWalletTransfer(wallet, address);
                },
              },
              {
                label: 'Cancel',
                buttonType: 'secondary',
                buttonHeight: 'sm',
                onClick: () => {
                  void props.onSuccess?.(null, false).catch(console.error);
                  return;
                },
              },
            ],
          });

          return;
        }
      } catch (err) {
        notifyError(`Error getting address status`);
        console.error(`Error getting address status: ${err}`);
      }
    }
    await handleWalletTransfer(wallet, address);
  };

  const onSessionKeyRevalidation = async (wallet: Wallet, address: string) => {
    const session = await getSessionFromWallet(wallet);
    const chainIdentifier = app.chain?.id || wallet.defaultNetwork;
    const validationBlockInfo = await getWalletRecentBlock(
      wallet,
      chainIdentifier,
    );

    // Start the create-user flow, so validationBlockInfo gets saved to the backend
    // This creates a new `Account` object
    const { account } = await signIn(session, {
      address,
      community_id: chainIdentifier,
      wallet_id: wallet.name,
      referrer_address: refcode,
      block_info: validationBlockInfo
        ? JSON.stringify(validationBlockInfo)
        : null,
    });
    await verifySession(session);
    console.log('Started new session for', wallet.chain, chainIdentifier);

    // ensure false for newlyCreated / linking vars on revalidate
    if (isMobile) {
      setSignerAccount(account);
      setIsNewlyCreated(false);
      setIsMobileWalletVerificationStep(true);
    } else {
      await onAccountVerified(account, false, false);
    }
  };

  const onVerifyMobileWalletSignature = async () => {
    await onAccountVerified(
      signerAccount,
      isNewlyCreated,
      false,
      selectedWallet,
    ).catch(console.error);
    setIsMobileWalletVerificationStep(false);
    props?.onModalClose?.();
  };

  const openMagicWallet = async () => {
    try {
      await magic.wallet.showUI();
    } catch (error) {
      console.trace(error);
    }
  };

  const onFarcasterLogin = async (
    signature: string,
    message: string,
    sessionPrivateKey: Uint8Array,
  ) => {
    try {
      const farcasterWallet = new FarcasterWebWalletController(
        signature,
        message,
        sessionPrivateKey,
      );
      await farcasterWallet.enable();

      const session = await getSessionFromWallet(farcasterWallet);
      const chainIdentifier = app.chain?.id || ChainBase.Ethereum;

      const { account, newlyCreated, joinedCommunity } = await signIn(session, {
        address: farcasterWallet.accounts[0],
        community_id: chainIdentifier,
        wallet_id: WalletId.Farcaster,
        block_info: null,
      });

      setIsNewlyCreated(newlyCreated);
      await onAccountVerified(account, newlyCreated, false, farcasterWallet);

      if (joinedCommunity) {
        trackAnalytics({
          event: MixpanelCommunityInteractionEvent.JOIN_COMMUNITY,
          isPWA: isAddedToHomeScreen,
        });
      }

      trackLoginEvent('farcaster', true);
    } catch (err) {
      notifyError('Error authenticating with Farcaster');
      console.error('Error authenticating with Farcaster:', err);
    }
  };

  return {
    wallets,
    isMagicLoading,
    isWalletConnectEnabled,
    isMobileWalletVerificationStep,
    onWalletAddressSelect,
    onWalletSelect,
    onResetWalletConnect,
    onEmailLogin,
    onSMSLogin,
    onSocialLogin,
    onFarcasterLogin,
    setEmail,
    setSMS,
    onVerifyMobileWalletSignature,
    openMagicWallet,
  };
};

export default useAuthentication;
