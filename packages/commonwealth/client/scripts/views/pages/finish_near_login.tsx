import React from 'react';
import type { Chain } from '@canvas-js/interfaces';
import { constructCanvasMessage } from 'adapters/shared';
import { initAppState } from 'state';
import BN from 'bn.js';
import { redraw } from 'mithrilInterop';
import { ChainBase, WalletId } from 'common-common/src/types';
import {
  completeClientLogin,
  createUserWithAddress,
  setActiveAccount,
  updateActiveAddresses,
} from 'controllers/app/login';
import type { NearAccount } from 'controllers/chain/near/account';
import type Near from 'controllers/chain/near/adapter';
import $ from 'jquery';
import type { WalletConnection } from 'near-api-js';
import { WalletAccount } from 'near-api-js';
import type { FunctionCallOptions } from 'near-api-js/lib/account';

import app from 'state';
import { PageLoading } from 'views/pages/loading';
import { PageNotFound } from 'views/pages/404';
import Sublayout from 'views/sublayout';
import { CWButton } from '../components/component_kit/cw_button';
import { CWText } from '../components/component_kit/cw_text';
import { isWindowMediumSmallInclusive } from '../components/component_kit/helpers';
import { LoginModal } from '../modals/login_modal';
import { Modal } from '../components/component_kit/cw_modal';
import { useCommonNavigate } from 'navigation/helpers';
import { useSearchParams } from 'react-router-dom';

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
  const [validationCompleted, setValidationCompleted] = React.useState<boolean>(
    false
  );
  const [
    validatedAccount,
    setValidatedAccount,
  ] = React.useState<NearAccount | null>(null);
  const [validationError, setValidationError] = React.useState<string>('');
  const [isNewAccount, setIsNewAccount] = React.useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  const validate = async (wallet: WalletConnection) => {
    try {
      // TODO: do we need to do this every time, or only on first connect?
      const acct: NearAccount = app.chain.accounts.get(wallet.getAccountId());

      const chain =
        app.user.selectedChain ||
        app.config.chains.getById(app.activeChainId());

      // create canvas thing
      const chainId = 'mainnet';
      const sessionPublicAddress = await app.sessions.getOrCreateAddress(
        ChainBase.NEAR,
        chainId
      );

      // We do not add blockInfo for NEAR
      const newAcct = await createUserWithAddress(
        acct.address,
        WalletId.NearWallet,
        chain.id,
        sessionPublicAddress,
        null
      );

      const canvasMessage = constructCanvasMessage(
        'near' as Chain,
        chainId,
        acct.address,
        sessionPublicAddress,
        +new Date(),
        null // no blockhash
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
        canvas.serializeSessionPayload(canvasMessage)
      );

      await acct.validate(signature, canvasMessage.sessionIssued, chainId);

      app.sessions
        .getSessionController(ChainBase.NEAR)
        .authSession(chainId, canvasMessage, signature);

      if (!app.isLoggedIn()) {
        await initAppState();
        await updateActiveAddresses(chain);
      }

      await setActiveAccount(acct);

      setValidatedAccount(acct);
    } catch (err) {
      setValidationError(
        err.responseJSON ? err.responseJSON.error : err.message
      );
      return;
    }

    // tx error handling
    const failedTx = searchParams.get('tx_failure');

    if (failedTx) {
      console.log(`Login failed: deleting storage key ${failedTx}`);

      if (localStorage[failedTx]) {
        delete localStorage[failedTx];
      }

      setValidationError('Login failed.');
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

        const res = await $.post(
          `${app.serverUrl()}/createChain`,
          chainCreateArgs
        );

        await initAppState(false);
        navigate(`${window.location.origin}/${res.result.chain.id}`);
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
      <Sublayout>
        <CWText>NEAR account log in error: {validationError}</CWText>
        <CWButton
          onClick={(e) => {
            e.preventDefault();
            redirectToNextPage(navigate);
          }}
          label="Return Home"
        />
      </Sublayout>
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
      <>
        <Modal
          content={
            <LoginModal
              onModalClose={() => {
                setIsModalOpen(false);
                redirectToNextPage(navigate);
              }}
              initialBody="welcome"
              initialSidebar="newOrReturning"
              initialAccount={validatedAccount}
            />
          }
          isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
          onClose={() => setIsModalOpen(false)}
          open={isModalOpen}
        />
        <Sublayout />
      </>
    );
  } else if (!validating) {
    // chain loaded and on near -- finish login and call lingering txs
    setValidating(true);

    const wallet = new WalletAccount(
      (app.chain as Near).chain.api,
      'commonwealth_near'
    );

    if (wallet.isSignedIn()) {
      validate(wallet).then(() => {
        setValidationCompleted(true);
        setValidating(false);
        redraw();
      });
    } else {
      setValidationError('Sign-in failed.');
      setValidating(false);
      setValidationCompleted(true);
      redraw();
    }
  } else {
    // validation in progress
  }
};

export default FinishNearLogin;
