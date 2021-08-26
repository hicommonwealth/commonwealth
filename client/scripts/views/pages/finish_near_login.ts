import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { WalletAccount } from 'near-api-js';

import app from 'state';
import { initAppState, navigateToSubpage } from 'app';

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
        navigateToSubpage('/', { replace: true });
      }
      return;
    } catch (e) {
      console.log('Error restoring path from localStorage');
    }
  }
  navigateToSubpage('/', { replace: true });
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
      // chain loaded and on near -- finish login
      // TODO: share one wallet account across all actual accounts and swap out
      //   login data from localStorage as needed.
      const validate = async () => {
        vnode.state.validating = true;
        const wallet = new WalletAccount((app.chain as Near).chain.api, null);
        console.log(wallet);
        if (wallet.isSignedIn()) {
          try {
            const acct: NearAccount = app.chain.accounts.get(wallet.getAccountId());
            console.log(acct);
            await createUserWithAddress(acct.address);
            await acct.validate();
            if (!app.isLoggedIn()) {
              await initAppState();
              const chain = app.user.selectedNode
                ? app.user.selectedNode.chain
                : app.config.nodes.getByChain(app.activeChainId())[0].chain;
              console.log(chain);
              await updateActiveAddresses(chain);
            }
            await setActiveAccount(acct);
            vnode.state.validatedAccount = acct;
            console.log('Validation success');
          } catch (err) {
            vnode.state.validationError = err.responseJSON ? err.responseJSON.error : err.message;
          } finally {
            vnode.state.validationCompleted = true;
            vnode.state.validating = false;
            m.redraw();
          }
        } else {
          vnode.state.validationError = 'Sign-in failed.';
          vnode.state.validating = false;
          vnode.state.validationCompleted = true;
          m.redraw();
        }
      };
      validate();
    } else {
      // validation in progress
    }
  }
};

export default FinishNearLogin;
