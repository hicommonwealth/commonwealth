import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { WalletAccount, WalletConnection } from 'near-api-js';
import { FunctionCallOptions } from 'near-api-js/lib/account';
import BN from 'bn.js';
import $ from 'jquery';

import app from 'state';
import { initAppState, navigateToSubpage } from 'app';

import { updateActiveAddresses, createUserWithAddress, setActiveAccount } from 'controllers/app/login';
import Near from 'controllers/chain/near/main';
import { NearAccount } from 'controllers/chain/near/account';
import { ChainBase } from 'types';
import Sublayout from 'views/sublayout';
import LinkNewAddressModal from 'views/modals/link_new_address_modal';
import PageLoading from 'views/pages/loading';
import PageNotFound from 'views/pages/404';

interface IState {
  validating: boolean;
  validationCompleted: boolean;
  validatedAccount: NearAccount | null;
  validationError: string;
  exitActionSelected: boolean;
}

// TODO:
//  - figure out how account switching will work
//    - we will need to guarantee that localStorage is clean before making the redirect call
//  - add styling to buttons on page
//  - test what happens if the wallet site fails
//  - move some of this stuff into controllers

const redirectToNextPage = () => {
  if (localStorage && localStorage.getItem && localStorage.getItem('nearPostAuthRedirect')) {
    // handle localStorage-based redirect after Github login (callback must occur within 1 day)
    try {
      const postAuth = JSON.parse(localStorage.getItem('nearPostAuthRedirect'));
      if (postAuth.path && (+new Date() - postAuth.timestamp < 24 * 60 * 60 * 1000)) {
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

const validate = async (vnode: m.Vnode<{}, IState>, wallet: WalletConnection) => {
  try {
    // TODO: do we need to do this every time, or only on first connect?
    const acct: NearAccount = app.chain.accounts.get(wallet.getAccountId());
    await createUserWithAddress(acct.address);
    const signature = await acct.signMessage(`${acct.validationToken}\n`);
    await acct.validate(signature);
    if (!app.isLoggedIn()) {
      await initAppState();
      const chain = app.user.selectedNode
        ? app.user.selectedNode.chain
        : app.config.nodes.getByChain(app.activeChainId())[0].chain;
      await updateActiveAddresses(chain);
    }
    await setActiveAccount(acct);
    vnode.state.validatedAccount = acct;
  } catch (err) {
    vnode.state.validationError = err.responseJSON ? err.responseJSON.error : err.message;
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
      const res = await $.post(`${app.serverUrl()}/addChainNode`, chainCreateArgs);
      await initAppState(false);
      m.route.set(`${window.location.origin}/${res.result.chain}`);
    } catch (err) {
      vnode.state.validationError = `Failed to initialize chain node: ${err.message}`;
    }
  }
};

const FinishNearLogin: m.Component<{}, IState> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', {
      'Page Name': 'LoginPage',
      'Scope': app.activeChainId(),
    });
  },
  view: (vnode) => {
    if (!app.chain || !app.chain.loaded || vnode.state.validating) {
      return m(PageLoading);
    }
    if (app.chain.base !== ChainBase.NEAR) {
      return m(PageNotFound);
    }
    if (vnode.state.validationError) {
      return m(Sublayout, {
        class: 'FinishNearLogin',
      }, [
        m('h3', `NEAR account log in error: ${vnode.state.validationError}`),
        m('button.formular-button-primary', {
          onclick: (e) => {
            e.preventDefault();
            redirectToNextPage();
          }
        }, 'Return Home'),
      ]);
    } else if (vnode.state.validationCompleted) {
      return m(Sublayout, {
        class: 'FinishNearLogin',
      }, [
        m('div', {
          oncreate: (e) => {
            if (vnode.state.validatedAccount.profile.name) {
              redirectToNextPage();
            } else {
              app.modals.create({
                modal: LinkNewAddressModal,
                data: { alreadyInitializedAccount: vnode.state.validatedAccount },
                exitCallback: () => {
                  redirectToNextPage();
                }
              });
            }
          }
        }),
      ]);
    } else if (!vnode.state.validating) {
      // chain loaded and on near -- finish login and call lingering txs
      vnode.state.validating = true;
      const wallet = new WalletAccount((app.chain as Near).chain.api, 'commonwealth_near');
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
  }
};

export default FinishNearLogin;
