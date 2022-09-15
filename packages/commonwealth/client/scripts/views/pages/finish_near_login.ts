import m from 'mithril';
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
import { isSameAccount } from 'helpers';
import { Account, AddressInfo } from 'models';
import Near from 'controllers/chain/near/main';
import { NearAccount } from 'controllers/chain/near/account';
import { ChainBase, WalletId } from 'common-common/src/types';
import Sublayout from 'views/sublayout';
import { PageLoading } from 'views/pages/loading';
import { PageNotFound } from 'views/pages/404';
import { NewLoginModal } from '../modals/login_modal';

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
        m.route.set(postAuth.path, {}, { replace: true });
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

const validate = async (
  vnode: m.Vnode<Record<string, never>, IState>,
  wallet: WalletConnection
) => {
  try {
    // TODO: do we need to do this every time, or only on first connect?
    const acct: NearAccount = app.chain.accounts.get(wallet.getAccountId());
    const chain =
      app.user.selectedChain || app.config.chains.getById(app.activeChainId());
    const newAcct = await createUserWithAddress(
      acct.address,
      WalletId.NearWallet,
      chain.id
    );
    vnode.state.isNewAccount = newAcct.newlyCreated;
    // vnode.state.account = newAcct.account;
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
    vnode.state.validatedAccount = acct;
  } catch (err) {
    vnode.state.validationError = err.responseJSON
      ? err.responseJSON.error
      : err.message;
    return;
  }

  // tx error handling
  const failedTx = m.route.param('tx_failure');
  if (failedTx) {
    console.log(`Login failed: deleting storage key ${failedTx}`);
    if (localStorage[failedTx]) {
      delete localStorage[failedTx];
    }
    vnode.state.validationError = 'Login failed.';
    return;
  }

  // tx success handling
  // TODO: ensure that create() calls redirect correctly
  const savedTx = m.route.param('saved_tx');
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
      vnode.state.validationError = err.message;
    }
  }

  // create new chain handling
  // TODO: we need to figure out how to clean this localStorage entry up
  //   in the case of transaction failure!!
  const chainName = m.route.param('chain_name');
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
      m.route.set(`${window.location.origin}/${res.result.chain.id}`);
    } catch (err) {
      vnode.state.validationError = `Failed to initialize chain node: ${err.message}`;
    }
  }
};

const FinishNearLogin: m.Component<Record<string, never>, IState> = {
  view: (vnode) => {
    if (!app.chain || !app.chain.loaded || vnode.state.validating) {
      return m(PageLoading);
    }
    if (app.chain.base !== ChainBase.NEAR) {
      return m(PageNotFound);
    }
    if (vnode.state.validationError) {
      return m(Sublayout, [
        m('h3', `NEAR account log in error: ${vnode.state.validationError}`),
        m(
          'button.formular-button-primary',
          {
            onclick: (e) => {
              e.preventDefault();
              redirectToNextPage();
            },
          },
          'Return Home'
        ),
      ]);
    } else if (vnode.state.validationCompleted) {
      return m(Sublayout, [
        m('div', {
          oncreate: async (e) => {
            if (vnode.state.validatedAccount.profile.name) {
              redirectToNextPage();
            } else {
              if (vnode.state.isNewAccount) {
                if (!app.isLoggedIn()) {
                  app.modals.create({
                    modal: NewLoginModal,
                    data: {
                      initialBody: 'welcome',
                      initialSidebar: 'newOrReturning',
                      initialAccount: vnode.state.validatedAccount,
                    },
                    exitCallback: () => {
                      redirectToNextPage();
                    },
                  });
                } else {
                  await completeClientLogin(vnode.state.validatedAccount);
                  redirectToNextPage();
                }
              } else {
                redirectToNextPage();
              }
            }
          },
        }),
      ]);
    } else if (!vnode.state.validating) {
      // chain loaded and on near -- finish login and call lingering txs
      vnode.state.validating = true;
      const wallet = new WalletAccount(
        (app.chain as Near).chain.api,
        'commonwealth_near'
      );
      if (wallet.isSignedIn()) {
        validate(vnode, wallet).then(() => {
          vnode.state.validationCompleted = true;
          vnode.state.validating = false;
          m.redraw();
        });
      } else {
        vnode.state.validationError = 'Sign-in failed.';
        vnode.state.validating = false;
        vnode.state.validationCompleted = true;
        m.redraw();
      }
    } else {
      // validation in progress
    }
  },
};

export default FinishNearLogin;
