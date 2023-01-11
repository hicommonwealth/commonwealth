/* @jsx jsx */
import React from 'react';

import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';
import { WalletAccount, WalletConnection } from 'near-api-js';
import { FunctionCallOptions } from 'near-api-js/lib/account';
import BN from 'bn.js';
import $ from 'jquery';

import app from 'state';
import { initAppState, navigateToSubpage } from 'app';
import {
  updateActiveAddresses,
  createUserWithAddress,
  setActiveAccount,
  completeClientLogin,
} from 'controllers/app/login';
import { Account } from 'models';
import Near from 'controllers/chain/near/adapter';
import { NearAccount } from 'controllers/chain/near/account';
import { ChainBase, WalletId } from 'common-common/src/types';
import Sublayout from 'views/sublayout';
import { PageLoading } from 'views/pages/loading';
import PageNotFound from 'views/pages/404';
import { NewLoginModal } from '../modals/login_modal';
import { isWindowMediumSmallInclusive } from '../components/component_kit/helpers';
import { CWText } from '../components/component_kit/cw_text';
import { CWButton } from '../components/component_kit/cw_button';

interface IState {
  validating: boolean;
  validationCompleted: boolean;
  validatedAccount: NearAccount | null;
  validationError: string;
  exitActionSelected: boolean;
  isNewAccount: boolean;
  account: Account;
}

// TODO:
//  - figure out how account switching will work
//    - we will need to guarantee that localStorage is clean before making the redirect call
//  - add styling to buttons on page
//  - test what happens if the wallet site fails
//  - move some of this stuff into controllers

const redirectToNextPage = () => {
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
        setRoute(postAuth.path, {}, { replace: true });
      } else {
        navigateToSubpage('/', { replace: true });
      }
      return;
    } catch (e) {
      console.error('Error restoring path from localStorage');
    }
  }
  navigateToSubpage('/', { replace: true });
};

class FinishNearLogin extends ClassComponent<Record<string, never>> {
  private state: IState = {
    validating: false,
    validationCompleted: false,
    validatedAccount: null,
    validationError: '',
    exitActionSelected: false,
    isNewAccount: false,
    account: null,
  };

  private async _validate(wallet: WalletConnection) {
    try {
      // TODO: do we need to do this every time, or only on first connect?
      const acct: NearAccount = app.chain.accounts.get(wallet.getAccountId());
      const chain =
        app.user.selectedChain ||
        app.config.chains.getById(app.activeChainId());
      const newAcct = await createUserWithAddress(
        acct.address,
        WalletId.NearWallet,
        chain.id
      );
      this.state.isNewAccount = newAcct.newlyCreated;
      // this.state.account = newAcct.account;
      acct.setValidationToken(newAcct.account.validationToken);
      acct.setWalletId(WalletId.NearWallet);
      acct.setAddressId(newAcct.account.addressId);
      const signature = await acct.signMessage(`${acct.validationToken}\n`);
      await acct.validate(signature);
      if (!app.isLoggedIn()) {
        await initAppState();
        await updateActiveAddresses(chain);
      }
      await setActiveAccount(acct);
      this.state.validatedAccount = acct;
    } catch (err) {
      this.state.validationError = err.responseJSON
        ? err.responseJSON.error
        : err.message;
      return;
    }

    // tx error handling
    const failedTx = getRouteParam('tx_failure');
    if (failedTx) {
      console.log(`Login failed: deleting storage key ${failedTx}`);
      if (localStorage[failedTx]) {
        delete localStorage[failedTx];
      }
      this.state.validationError = 'Login failed.';
      return;
    }

    // tx success handling
    // TODO: ensure that create() calls redirect correctly
    const savedTx = getRouteParam('saved_tx');
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
        this.state.validationError = err.message;
      }
    }

    // create new chain handling
    // TODO: we need to figure out how to clean this localStorage entry up
    //   in the case of transaction failure!!
    const chainName = getRouteParam('chain_name');
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
        setRoute(`${window.location.origin}/${res.result.chain.id}`);
      } catch (err) {
        this.state.validationError = `Failed to initialize chain node: ${err.message}`;
      }
    }
  }

  public view() {
    if (!app.chain || !app.chain.loaded || this.state.validating) {
      return <PageLoading />;
    }
    if (app.chain.base !== ChainBase.NEAR) {
      return <PageNotFound />;
    }
    if (this.state.validationError) {
      return (
        <Sublayout>
          <CWText>
            NEAR account log in error: {this.state.validationError}
          </CWText>
          <CWButton
            onClick={(e) => {
              e.preventDefault();
              redirectToNextPage();
            }}
            label="Return Home"
          />
        </Sublayout>
      );
    } else if (this.state.validationCompleted) {
      return (
        <Sublayout>
          <div
            oncreate={async () => {
              if (this.state.validatedAccount.profile.name) {
                redirectToNextPage();
              } else {
                if (this.state.isNewAccount) {
                  if (!app.isLoggedIn()) {
                    app.modals.create({
                      modal: NewLoginModal,
                      data: {
                        initialBody: 'welcome',
                        initialSidebar: 'newOrReturning',
                        initialAccount: this.state.validatedAccount,
                        modalType: isWindowMediumSmallInclusive(
                          window.innerWidth
                        )
                          ? 'fullScreen'
                          : 'centered',
                        breakpointFn: isWindowMediumSmallInclusive,
                      },
                      exitCallback: () => {
                        redirectToNextPage();
                      },
                    });
                  } else {
                    await completeClientLogin(this.state.validatedAccount);
                    redirectToNextPage();
                  }
                } else {
                  redirectToNextPage();
                }
              }
            }}
          />
        </Sublayout>
      );
    } else if (!this.state.validating) {
      // chain loaded and on near -- finish login and call lingering txs
      this.state.validating = true;
      const wallet = new WalletAccount(
        (app.chain as Near).chain.api,
        'commonwealth_near'
      );
      if (wallet.isSignedIn()) {
        this._validate(wallet).then(() => {
          this.state.validationCompleted = true;
          this.state.validating = false;
          redraw();
        });
      } else {
        this.state.validationError = 'Sign-in failed.';
        this.state.validating = false;
        this.state.validationCompleted = true;
        redraw();
      }
    } else {
      // validation in progress
    }
  }
}

export default FinishNearLogin;
