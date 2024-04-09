import { ChainBase, WalletId } from '@hicommonwealth/core';
import axios from 'axios';
import BN from 'bn.js';
import {
  completeClientLogin,
  createUserWithAddress,
  setActiveAccount,
  updateActiveAddresses,
} from 'controllers/app/login';
import type { NearAccount } from 'controllers/chain/near/account';
import type Near from 'controllers/chain/near/adapter';
import { useCommonNavigate } from 'navigation/helpers';
import type { WalletConnection } from 'near-api-js';
import { WalletAccount } from 'near-api-js';
import type { FunctionCallOptions } from 'near-api-js/lib/account';
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { verifySession } from 'shared/canvas/verify';
import app, { initAppState } from 'state';
import { PageNotFound } from 'views/pages/404';
import { PageLoading } from 'views/pages/loading';
import { CWText } from '../components/component_kit/cw_text';
import { CWButton } from '../components/component_kit/new_designs/CWButton';
import { AuthModal } from '../modals/AuthModal';

// TODO:
//  - figure out how account switching will work
//    - we will need to guarantee that localStorage is clean before making the redirect call
//  - add styling to buttons on page
//  - test what happens if the wallet site fails
//  - move some of this stuff into controllers

const redirectToNextPage = (navigate) => {
  if (
    localStorage &&
    localStorage.getItem &&
    localStorage.getItem('nearPostAuthRedirect')
  ) {
    // handle localStorage-based redirect after Github login (callback must occur within 1 day)
    try {
      const postAuth = JSON.parse(localStorage.getItem('nearPostAuthRedirect'));

      if (
        postAuth.path &&
        +new Date() - postAuth.timestamp < 24 * 60 * 60 * 1000
      ) {
        localStorage.removeItem('nearPostAuthRedirect');
        navigate(postAuth.path, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
      return;
    } catch (e) {
      console.error('Error restoring path from localStorage');
    }
  }

  navigate('/', { replace: true });
};

const FinishNearLogin = () => {
  const navigate = useCommonNavigate();
  const [searchParams] = useSearchParams();
  const [validating, setValidating] = React.useState<boolean>(false);
  const [validationCompleted, setValidationCompleted] =
    React.useState<boolean>(false);
  const [validatedAccount, setValidatedAccount] =
    React.useState<NearAccount | null>(null);
  const [validationError, setValidationError] = React.useState<string>('');
  const [isNewAccount, setIsNewAccount] = React.useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  const validate = async (wallet: WalletConnection) => {
    try {
      // TODO: do we need to do this every time, or only on first connect?
      const acct = app.chain.accounts.get(wallet.getAccountId()) as NearAccount;

      const community =
        app.user.selectedCommunity ||
        app.config.chains.getById(app.activeChainId());

      // create canvas thing
      const chainId = 'mainnet';
      // @ts-ignore
      const sessionPublicAddress = await app.sessions.getOrCreateAddress(
        ChainBase.NEAR,
        chainId,
        acct.address,
      );

      // We do not add blockInfo for NEAR
      const newAcct = await createUserWithAddress(
        acct.address,
        WalletId.NearWallet,
        null, // no wallet sso source
        community.id,
        sessionPublicAddress,
        null,
      );

      // @ts-ignore
      const canvasSessionPayload = createCanvasSessionPayload(
        'near' as ChainBase,
        chainId,
        acct.address,
        sessionPublicAddress,
        +new Date(),
        null, // no blockhash
      );

      setIsNewAccount(newAcct.newlyCreated);
      // account = newAcct.account;
      acct.setValidationToken(newAcct.account.validationToken);
      acct.setWalletId(WalletId.NearWallet);
      acct.setAddressId(newAcct.account.addressId);
      acct.setSessionPublicAddress(sessionPublicAddress);
      acct.setValidationBlockInfo(null);

      const canvas = await import('@canvas-js/interfaces');
      const signature = await acct.signMessage(
        // @ts-ignore
        canvas.serializeSessionPayload(canvasSessionPayload),
      );

      await acct.validate(
        signature,
        canvasSessionPayload.sessionIssued,
        // @ts-ignore
        chainId,
      );

      verifySession(canvasSessionPayload);

      if (!app.isLoggedIn()) {
        await initAppState();
        await updateActiveAddresses({ chain: community });
      }

      await setActiveAccount(acct);

      setValidatedAccount(acct);
    } catch (err) {
      setValidationError(
        err.responseJSON ? err.responseJSON.error : err.message,
      );
      return;
    }

    // tx error handling
    const failedTx = searchParams.get('tx_failure');

    if (failedTx) {
      console.log(`Sign in failed: deleting storage key ${failedTx}`);

      if (localStorage[failedTx]) {
        delete localStorage[failedTx];
      }

      setValidationError('Sign in failed.');
      return;
    }

    // tx success handling
    // TODO: ensure that create() calls redirect correctly
    const savedTx = searchParams.get('saved_tx');

    if (savedTx && localStorage[savedTx]) {
      try {
        // fetch tx localstorage hash and execute
        const txString = localStorage[savedTx];

        delete localStorage[savedTx];

        // tx object
        const tx = JSON.parse(txString);
        // rehydrate BN
        if (tx.attachedDeposit) {
          tx.attachedDeposit = new BN(tx.attachedDeposit);
        }

        if (tx.gas) {
          tx.gas = new BN(tx.gas);
        }

        await wallet.account().functionCall(tx as FunctionCallOptions);
      } catch (err) {
        setValidationError(err.message);
      }
    }

    // create new chain handling
    // TODO: we need to figure out how to clean this localStorage entry up
    //   in the case of transaction failure!!
    const chainName = searchParams.get('chain_name');

    if (chainName && localStorage[chainName]) {
      try {
        const chainCreateArgString = localStorage[chainName];

        delete localStorage[chainName];

        // POST object
        const chainCreateArgs = JSON.parse(chainCreateArgString);

        const res = await axios.post(
          `${app.serverUrl()}/communities`,
          chainCreateArgs,
        );

        await initAppState(false);
        navigate(`${window.location.origin}/${res.data.result.chain.id}`);
      } catch (err) {
        setValidationError(`Failed to initialize chain node: ${err.message}`);
      }
    }
  };

  if (!app.chain || !app.chain.loaded || validating) {
    return <PageLoading />;
  }

  if (app.chain.base !== ChainBase.NEAR) {
    return <PageNotFound />;
  }

  if (validationError) {
    return (
      <>
        <CWText>NEAR account sign in error: {validationError}</CWText>
        <CWButton
          onClick={(e) => {
            e.preventDefault();
            redirectToNextPage(navigate);
          }}
          label="Return Home"
        />
      </>
    );
  } else if (validationCompleted) {
    if (validatedAccount.profile.name) {
      redirectToNextPage(navigate);
    } else {
      if (isNewAccount) {
        if (!app.isLoggedIn()) {
          setIsModalOpen(true);
        } else {
          completeClientLogin(validatedAccount).then(() => {
            redirectToNextPage(navigate);
          });
        }
      } else {
        redirectToNextPage(navigate);
      }
    }

    return (
      <AuthModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          redirectToNextPage(navigate);
        }}
        onSuccess={() => setIsModalOpen(false)}
        showWalletsFor={validatedAccount.walletId as any}
      />
    );
  } else if (!validating) {
    // chain loaded and on near -- finish login and call lingering txs
    setValidating(true);

    const wallet = new WalletAccount(
      (app.chain as Near).chain.api,
      'commonwealth_near',
    );

    if (wallet.isSignedIn()) {
      validate(wallet).then(() => {
        setValidationCompleted(true);
        setValidating(false);
      });
    } else {
      setValidationError('Sign-in failed.');
      setValidating(false);
      setValidationCompleted(true);
    }
  } else {
    // validation in progress
  }
};

export default FinishNearLogin;
