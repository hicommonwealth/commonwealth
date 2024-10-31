import type { Session } from '@canvas-js/interfaces';
import {
  addressSwapper,
  ChainBase,
  DEFAULT_NAME,
  verifySession,
  WalletSsoSource,
} from '@hicommonwealth/shared';
import axios from 'axios';
import {
  completeClientLogin,
  createUserWithAddress,
  setActiveAccount,
  startLoginWithMagicLink,
  updateActiveAddresses,
} from 'controllers/app/login';
import {
  notifyError,
  notifyInfo,
  notifySuccess,
} from 'controllers/app/notifications';
import WebWalletController from 'controllers/app/web_wallets';
import TerraWalletConnectWebWalletController from 'controllers/app/webWallets/terra_walletconnect_web_wallet';
import WalletConnectWebWalletController from 'controllers/app/webWallets/walletconnect_web_wallet';
import type Substrate from 'controllers/chain/substrate/adapter';
import {
  getSessionFromWallet,
  signSessionWithAccount,
} from 'controllers/server/sessions';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import app, { initAppState } from 'state';
import { SERVER_URL } from 'state/api/config';
import { DISCOURAGED_NONREACTIVE_fetchProfilesByAddress } from 'state/api/profiles/fetchProfilesByAddress';
import { useUpdateUserMutation } from 'state/api/user';
import useUserStore from 'state/ui/user';
import {
  BaseMixpanelPayload,
  MixpanelCommunityInteractionEvent,
  MixpanelLoginEvent,
  MixpanelLoginPayload,
} from '../../../../../shared/analytics/types';
import NewProfilesController from '../../../controllers/server/newProfiles';
import { setDarkMode } from '../../../helpers/darkMode';
import { getAddressFromWallet } from '../../../helpers/wallet';
import useAppStatus from '../../../hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from '../../../hooks/useBrowserAnalyticsTrack';
import Account from '../../../models/Account';
import IWebWallet from '../../../models/IWebWallet';

type UseAuthenticationProps = {
  onSuccess?: (
    address?: string | null | undefined,
    isNewlyCreated?: boolean,
  ) => Promise<void>;
  onModalClose: () => void;
  withSessionKeyLoginFlow?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Wallet = IWebWallet<any>;

const useAuthentication = (props: UseAuthenticationProps) => {
  const [username, setUsername] = useState<string>(DEFAULT_NAME);
  const [email, setEmail] = useState<string>();
  const [wallets, setWallets] = useState<Array<Wallet>>();
  const [selectedWallet, setSelectedWallet] = useState<Wallet>();
  const [primaryAccount, setPrimaryAccount] = useState<Account>();
  const [isMagicLoading, setIsMagicLoading] = useState<boolean>();
  // @ts-expect-error <StrictNullChecks>
  const [signerAccount, setSignerAccount] = useState<Account>(null);
  const [isNewlyCreated, setIsNewlyCreated] = useState<boolean>(false);
  const [isMobileWalletVerificationStep, setIsMobileWalletVerificationStep] =
    useState(false);

  const { isAddedToHomeScreen } = useAppStatus();

  const user = useUserStore();

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

  useEffect(() => {
    if (process.env.ETH_RPC === 'e2e-test') {
      import('../../../helpers/mockMetaMaskUtil')
        .then((f) => {
          window['ethereum'] = new f.MockMetaMaskProvider(
            `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_PUBLIC_APP_KEY}`,
            '0x09187906d2ff8848c20050df632152b5b27d816ec62acd41d4498feb522ac5c3',
          );
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
      ];
      setWallets(
        _.flatten(
          sortedChainBases.map((base) =>
            WebWalletController.Instance.availableWallets(base),
          ),
        ),
      );
    }
  }, []);

  const handleSuccess = async (
    authAddress?: string | null | undefined,
    isNew?: boolean,
  ) => {
    await props?.onSuccess?.(authAddress, isNew);
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

      await handleSuccess(magicAddress, isNewlyCreated);
      props?.onModalClose?.();

      trackLoginEvent('email', true);
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

      await handleSuccess(magicAddress, isNewlyCreated);
      props?.onModalClose?.();

      trackLoginEvent(provider, true);
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
      if (localStorage.getItem('user-dark-mode-state') === 'on') {
        setDarkMode(true);
      }
      if (app.chain) {
        await updateActiveAddresses(app.activeChainId() || '');
      }
    }

    if (exitOnComplete) {
      props?.onModalClose?.();
      await handleSuccess(account.address, newelyCreated);
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
      await handleSuccess(account.address, newlyCreated);
      return;
    }

    const walletToUse = wallet || selectedWallet;

    // Handle Logged in and joining community of different chain base
    if (app.activeChainId() && user.isLoggedIn) {
      // @ts-expect-error StrictNullChecks
      const session = await getSessionFromWallet(walletToUse);
      await account.validate(session);
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
        await account.validate(session);
        await onLogInWithAccount(account, true, newlyCreated);
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
      // @ts-expect-error StrictNullChecks
      await account.validate(session);
      // @ts-expect-error StrictNullChecks
      await verifySession(session);
      // @ts-expect-error <StrictNullChecks>
      await onLogInWithAccount(account, false, true);
      // Important: when we first create an account and verify it, the user id
      // is initially null from api (reloading the page will update it), to correct
      // it we need to get the id from api
      const userAddresses =
        await DISCOURAGED_NONREACTIVE_fetchProfilesByAddress(
          [account!.profile!.chain],
          [account!.profile!.address],
        );
      const currentUserAddress = userAddresses[0];
      if (!currentUserAddress) {
        console.log('No profile yet.');
      } else {
        account?.profile?.initialize(
          currentUserAddress.userId,
          currentUserAddress.name,
          currentUserAddress.address,
          currentUserAddress.avatarUrl ?? '',
          account?.profile?.chain,
          new Date(currentUserAddress.lastActive),
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
      if (username && account?.profile) {
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

  const onNormalWalletLogin = async (wallet: Wallet, address: string) => {
    setSelectedWallet(wallet);

    if (user.isLoggedIn) {
      try {
        const res = await axios.post(`${SERVER_URL}/getAddressStatus`, {
          address:
            wallet.chain === ChainBase.Substrate
              ? addressSwapper({
                  address: address,
                  currentPrefix: parseInt(
                    `${(app.chain as Substrate)?.meta.ss58_prefix || 0}`,
                    10,
                  ),
                })
              : address,
          community_id: app.activeChainId() ?? wallet.chain,
          jwt: user.jwt,
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
      } = await createUserWithAddress(
        address,
        wallet.name,
        chainIdentifier,
        session.publicKey,
        validationBlockInfo,
      );

      setIsNewlyCreated(newlyCreated);
      if (isMobile) {
        setSignerAccount(signingAccount);
        setIsMobileWalletVerificationStep(true);
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

  const onSessionKeyRevalidation = async (wallet: Wallet, address: string) => {
    const session = await getSessionFromWallet(wallet);
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
      chainIdentifier,
      // TODO: I don't think we need this field in Account at all
      session.publicKey,
      validationBlockInfo,
    );
    account.setValidationBlockInfo(
      // @ts-expect-error <StrictNullChecks>
      validationBlockInfo ? JSON.stringify(validationBlockInfo) : null,
    );

    await account.validate(session);
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
    );
    setIsMobileWalletVerificationStep(false);
    props?.onModalClose?.();
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
    onSocialLogin,
    setEmail,
    onVerifyMobileWalletSignature,
  };
};

export default useAuthentication;
