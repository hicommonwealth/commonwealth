import m from 'mithril';
import $ from 'jquery';
import app from 'state';

import { ChainNetwork } from 'types';

import PageLoading from 'views/pages/loading';
import PageNotFound from 'views/pages/404';
import { initAppState } from 'app';
import { setActiveAccount, updateActiveAddresses } from 'controllers/app/login';

interface IState {
  validating: boolean;
}

// creates address, initializes account, and redirects to main page
const validate = async (token: string, chain: string): Promise<void> => {
  // verifyAddress against token, returns user if not logged in
  const result = await $.post(`${app.serverUrl()}/verifyAddress`, { token, chain });
  if (result.status === 'Success') {
    if (result.result.user) {
      // TODO: refactor/DRY this against finish_near_login
      // new login
      if (app.isLoggedIn()) {
        // TODO: something on error
        console.error('Already logged in? Should not have created a new user');
      }
      await initAppState();
      const selectedChainMeta = app.user.selectedNode
        ? app.user.selectedNode.chain
        : app.config.nodes.getByChain(chain)[0].chain;
      await updateActiveAddresses(selectedChainMeta);
    }
    if (result.result.address) {
      try {
        // should be an ETH account, for Axie
        const acct = app.chain.accounts.get(result.result.address);
        await setActiveAccount(acct);
      } catch (e) {
        // TODO: something on error
        console.error(`Failed to create Axie address: ${e.message}`);
      }
    } else {
      // TODO: something on error
      console.error('Did not receive an address from verifyAddress... what happened?');
    }
  } else {
    // TODO: something on error
    console.error(`Got login error: ${JSON.stringify(result)}`);
  }
  // TODO: redirect
}

const FinishAxieLogin: m.Component<Record<string, unknown>, IState> = {
  oninit: (vnode) => {
    // grab token
    // TODO: how to use state id?
    const token = m.route.param('token');
    console.log(token);
    validate(token, 'axie-infinity');
  },
  view: (vnode) => {
    console.log('finish axie login');
    // TODO: do we need to kick off loading?
    // if (!app.chain || !app.chain.loaded || vnode.state.validating) {
    //   return m(PageLoading);
    // }
    // TODO: generalize this to any SSO chain
    // if (app.chain.network !== ChainNetwork.AxieInfinity) {
    //   return m(PageNotFound);
    // }


    // send token to server for login
    // TODO: see oninit
  }
};

export default FinishAxieLogin;
