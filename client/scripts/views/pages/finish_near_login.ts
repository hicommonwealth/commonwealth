import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import * as nearlib from 'nearlib';

import app from 'state';
import { initAppState } from 'app';

import { updateActiveAddresses, createUserWithAddress, setActiveAccount } from 'controllers/app/login';
import Near from 'controllers/chain/near/main';
import { NearAccount } from 'controllers/chain/near/account';
import { ChainBase } from 'models';
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
        m.route.set(`/${app.activeChainId()}/`, { replace: true });
      }
      return;
    } catch (e) {
      console.log('Error restoring path from localStorage');
    }
  }
  m.route.set(`/${app.activeChainId()}/`, { replace: true });
};

const FinishNearLogin: m.Component<{}, IState> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', {
      'Page Name': 'LoginPage',
      'Scope': app.activeId(),
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
          onclick: async (e) => {
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
            if (vnode.state.validatedAccount.profile.name !== undefined) {
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
    // chain loaded and on near -- finish login
    // TODO: share one wallet account across all actual accounts and swap out
    //   login data from localStorage as needed.
      vnode.state.validating = true;
      const wallet = new nearlib.WalletAccount((app.chain as Near).chain.api, null);
      if (wallet.isSignedIn()) {
        const acct: NearAccount = app.chain.accounts.get(wallet.getAccountId());
        acct.updateKeypair().then((gotKeypair) => {
          if (!gotKeypair) {
            throw new Error('unable to fetch keypair from localStorage');
          }
          return createUserWithAddress(acct.address);
        })
          .then(() => {
            return acct.validate();
          })
          .then(async () => {
            if (!app.isLoggedIn()) {
              await initAppState();
              const chain = app.user.selectedNode
                ? app.user.selectedNode.chain
                : app.config.nodes.getByChain(app.activeChainId())[0].chain;
              await updateActiveAddresses(chain);
            }
            await setActiveAccount(acct);
          })
          .then(() => {
            vnode.state.validationCompleted = true;
            vnode.state.validating = false;
            vnode.state.validatedAccount = acct;
            m.redraw();
          })
          .catch((err) => {
            vnode.state.validationCompleted = true;
            vnode.state.validationError = err.responseJSON ? err.responseJSON.error : JSON.stringify(err);
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
