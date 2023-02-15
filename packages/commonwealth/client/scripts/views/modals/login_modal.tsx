import React, { useEffect, useState } from 'react';

import {
  chainBasetoCanvasChain,
  constructCanvasMessage,
} from 'adapters/shared';
import { initAppState } from 'state';
import { ChainBase } from 'common-common/src/types';
import {
  completeClientLogin,
  loginWithMagicLink,
  updateActiveAddresses,
} from 'controllers/app/login';
import { notifyError } from 'controllers/app/notifications';
import TerraWalletConnectWebWalletController from 'controllers/app/webWallets/terra_walletconnect_web_wallet';
import WalletConnectWebWalletController from 'controllers/app/webWallets/walletconnect_web_wallet';
import type { Account, IWebWallet } from 'models';
import app from 'state';
import _ from 'underscore';
import { isWindowMediumSmallInclusive } from '../components/component_kit/helpers';
import type { ProfileRowProps } from '../components/component_kit/cw_profiles_list';
import { LoginDesktop } from '../pages/login/login_desktop';
import { LoginMobile } from '../pages/login/login_mobile';
import type { LoginBodyType, LoginSidebarType } from '../pages/login/types';

type LoginModalProps = {
  initialBody?: LoginBodyType;
  initialSidebar?: LoginSidebarType;
  initialAccount?: Account;
  initialWallets?: IWebWallet<any>[];
  onSuccess?: () => void;
  onModalClose: () => void;
};

async function signWithWallet<T extends { address: string }>(
  wallet: IWebWallet<T>,
  account: Account
) {
  const chainId = wallet.getChainId();
  const sessionPublicAddress = await app.sessions.getOrCreateAddress(
    wallet.chain,
    chainId
  );

  const canvasMessage = constructCanvasMessage(
    chainBasetoCanvasChain(wallet.chain),
    chainId,
    account.address,
    sessionPublicAddress,
    account.validationBlockInfo
  );

  return wallet.signCanvasMessage(account, canvasMessage);
}

export const LoginModal = (props: LoginModalProps) => {
  const [avatarUrl, setAvatarUrl] = useState('');
  const [address, setAddress] = useState(props.initialAccount?.address || '');
  const [bodyType, setBodyType] = useState<LoginBodyType>(
    props.initialBody || 'walletList'
  );
  const [profiles, setProfiles] = useState<Array<ProfileRowProps>>([]);
  const [sidebarType, setSidebarType] = useState<LoginSidebarType>(
    props.initialSidebar || 'communityWalletOptions'
  );
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [wallets, setWallets] = useState<Array<IWebWallet<any>>>(
    props.initialWallets || []
  );
  const [selectedWallet, setSelectedWallet] = useState<IWebWallet<any>>(null);
  const [selectedLinkingWallet, setSelectedLinkingWallet] =
    useState<IWebWallet<any>>(null);
  const [cachedWalletSignature, setCachedWalletSignature] = useState('');
  const [cachedChainId, setCachedChainId] = useState<string | number>(null);
  const [primaryAccount, setPrimaryAccount] = useState<Account>(
    props.initialAccount || null
  );
  const [secondaryLinkAccount, setSecondaryLinkAccount] =
    useState<Account>(null);
  const [secondaryChainId, setSecondaryChainId] = useState<string | number>(
    null
  );
  const [currentlyInCommunityPage] = useState(
    app.activeChainId() !== undefined
  );
  const [magicLoading, setMagicLoading] = useState(false);
  const [showMobile, setShowMobile] = useState(false);

  useEffect(() => {
    if (currentlyInCommunityPage) {
      const chainbase = app.chain?.meta?.base;
      setWallets(app.wallets.availableWallets(chainbase));
      setSidebarType('communityWalletOptions');
      setBodyType('walletList');
    } else {
      const allChains = app.config.chains.getAll();
      const sortedChainBases = [
        ChainBase.CosmosSDK,
        ChainBase.Ethereum,
        ChainBase.Substrate,
        ChainBase.Solana,
      ].filter((base) => allChains.find((chain) => chain.base === base));
      const flattenWallets = _.flatten(
        sortedChainBases.map((base) => {
          return app.wallets.availableWallets(base);
        })
      );

      setWallets(flattenWallets);
      setSidebarType('connectWallet');
      setBodyType('walletList');
    }

    const isMobile = isWindowMediumSmallInclusive(window.innerWidth);
    setShowMobile(isMobile);

    // console.log('props initial boduy', props.initialBody);
    // setBodyType(props.initialBody);
  }, [currentlyInCommunityPage, props.initialBody]);

  const { onSuccess } = props;

  const wcEnabled = _.any(
    wallets,
    (w) =>
      (w instanceof WalletConnectWebWalletController ||
        w instanceof TerraWalletConnectWebWalletController) &&
      w.enabled
  );

  // Handles Magic Link Login
  const handleEmailLoginCallback = async () => {
    setMagicLoading(true);

    if (!email) {
      notifyError('Please enter a valid email address.');
      setMagicLoading(false);
      return;
    }

    try {
      await loginWithMagicLink(email);
      setMagicLoading(true);
      onSuccess?.();
      props.onModalClose();
    } catch (err) {
      notifyError("Couldn't send magic link");
      setMagicLoading(false);
      console.error(err);
    }
  };

  // Performs Login on the client
  const logInWithAccount = async (
    account: Account,
    exitOnComplete: boolean
  ) => {
    setAddress(account.address);
    setUsername(account.profile.name);

    if (app.isLoggedIn()) {
      await completeClientLogin(account);
    } else {
      // log in as the new user
      await initAppState(false);

      if (app.chain) {
        const chain =
          app.user.selectedChain ||
          app.config.chains.getById(app.activeChainId());

        await updateActiveAddresses(chain);
      }
    }

    if (exitOnComplete) {
      props.onModalClose();
      onSuccess?.();
    }
  };

  const accountVerifiedCallback = async (
    account: Account,
    newlyCreated: boolean,
    linking: boolean
  ) => {
    console.log('2 selected wallet is undefined here')
    // Handle Logged in and joining community of different chain base
    if (currentlyInCommunityPage && app.isLoggedIn()) {
      const signature = await signWithWallet(selectedWallet, account);
      await account.validate(signature, selectedWallet.getChainId());
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
      setSecondaryChainId(selectedWallet.getChainId());
      setProfiles([account.profile]);
    }

    // Handle receiving and caching wallet signature strings
    if (!newlyCreated && !linking) {
      try {
        console.log('selectedWallet@@', selectedWallet);
        const signature = await signWithWallet(selectedWallet, account);
        await account.validate(signature, selectedWallet.getChainId());
        await logInWithAccount(account, true);
      } catch (err) {
        console.log(err);
      }
    } else {
      if (!linking) {
        try {
          const signature = await signWithWallet(selectedWallet, account);
          setCachedWalletSignature(signature);
          setCachedChainId(selectedWallet.getChainId());
        } catch (err) {
          console.log(err);
        }
        setSidebarType('newOrReturning');
        setBodyType('selectAccountType');
      } else {
        setSidebarType('newAddressLinked');
        setBodyType('selectProfile');
      }
    }
  };

  // Handle Logic for creating a new account, including validating signature
  const createNewAccountCallback = async () => {
    try {
      if (selectedWallet.chain !== 'near') {
        await primaryAccount.validate(cachedWalletSignature, cachedChainId);
      }

      await logInWithAccount(primaryAccount, false);
    } catch (err) {
      console.log(err);
      notifyError('Failed to create account. Please try again.');
      props.onModalClose();
    }

    setBodyType('welcome');
  };

  // Handle branching logic for linking an account
  const linkExistingAccountCallback = async () => {
    setBodyType('selectPrevious');
  };

  // Handle signature and validation logic for linking an account
  // Validates both linking (secondary) and primary accounts
  const performLinkingCallback = async () => {
    try {
      const signature = await signWithWallet(
        selectedLinkingWallet,
        secondaryLinkAccount
      );
      await secondaryLinkAccount.validate(signature, secondaryChainId);
      await primaryAccount.validate(cachedWalletSignature, cachedChainId);
      await logInWithAccount(primaryAccount, true);
    } catch (err) {
      console.log(err);
      notifyError('Unable to link account');
    }
  };

  // Handle saving profile information
  const saveProfileInfoCallback = async () => {
    const data = {
      name: username,
      avatarUrl: avatarUrl,
    };

    try {
      if (username || avatarUrl) {
        await app.profiles.updateProfileForAccount(primaryAccount, data);
      }

      onSuccess?.();
    } catch (err) {
      console.log(err);
      notifyError('Failed to save profile info');
    } finally {
      props.onModalClose();
    }
  };

  return showMobile ? (
    <LoginMobile
      address={address}
      currentlyInCommunityPage={currentlyInCommunityPage}
      bodyType={bodyType}
      profiles={profiles}
      sidebarType={sidebarType}
      username={username}
      wallets={wallets}
      magicLoading={magicLoading}
      setAddress={setAddress}
      setBodyType={setBodyType}
      handleSetAvatar={setAvatarUrl}
      handleSetUsername={setUsername}
      handleSetEmail={(e) => {
        setEmail(e.target.value);
      }}
      setProfiles={setProfiles}
      setSidebarType={setSidebarType}
      setSelectedWallet={setSelectedWallet}
      setSelectedLinkingWallet={setSelectedLinkingWallet}
      createNewAccountCallback={createNewAccountCallback}
      linkExistingAccountCallback={linkExistingAccountCallback}
      accountVerifiedCallback={accountVerifiedCallback}
      handleEmailLoginCallback={handleEmailLoginCallback}
      saveProfileInfoCallback={saveProfileInfoCallback}
      performLinkingCallback={performLinkingCallback}
      showResetWalletConnect={wcEnabled}
      onModalClose={props.onModalClose}
    />
  ) : (
    <LoginDesktop
      address={address}
      currentlyInCommunityPage={currentlyInCommunityPage}
      bodyType={bodyType}
      profiles={profiles}
      sidebarType={sidebarType}
      username={username}
      wallets={wallets}
      magicLoading={magicLoading}
      setAddress={setAddress}
      setBodyType={setBodyType}
      handleSetAvatar={setAvatarUrl}
      handleSetUsername={setUsername}
      handleSetEmail={setEmail}
      setProfiles={setProfiles}
      setSidebarType={setSidebarType}
      setSelectedWallet={(wallet) => {
        console.log('1 wallet is being set');
        setSelectedWallet(wallet);
      }}
      setSelectedLinkingWallet={setSelectedWallet}
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
