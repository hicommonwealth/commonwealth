import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component } from 'mithrilInterop';

import { PageLoading } from 'views/pages/loading';
import { initAppState } from 'app';
import { updateActiveAddresses } from 'controllers/app/login';
import ErrorPage from './error';

interface IState {
  validating: boolean;
  error: string;
}

// creates address, initializes account, and redirects to main page
const validate = async (
  token: string,
  stateId: string,
  chain: string
): Promise<void | string> => {
  // verifyAddress against token, returns user if not logged in
  let result;
  try {
    result = await $.post(`${app.serverUrl()}/auth/sso/callback`, {
      token,
      issuer: 'AxieInfinity',
      stateId,
    });
  } catch (e) {
    console.error(`Post request error: ${e.responseText}`);
    return `Login Error: ${e.responseText}`;
  }
  if (result.status === 'Success') {
    await initAppState();
    const selectedChainMeta = app.config.chains.getById('axie-infinity');
    await updateActiveAddresses(selectedChainMeta);
    console.log('Navigating to axie infinite community');
    setRoute('/axie-infinity');
  } else {
    console.error(`Got login error: ${JSON.stringify(result)}`);
    return `Login error: ${JSON.stringify(result)}`;
  }
};

const FinishAxieLogin: Component<Record<string, unknown>, IState> = {
  oninit: (vnode) => {
    // grab token
    // TODO: how to use state id?
    const token = getRouteParam('token');
    const stateId = getRouteParam('stateId');
    validate(token, stateId, 'axie-infinity').then((res) => {
      if (typeof res === 'string') {
        vnode.state.error = res;
        redraw();
      }
    });
  },
  view: (vnode) => {
    console.log('finish axie login');
    if (vnode.state.error) {
      return render(ErrorPage, { title: 'Login Error', message: vnode.state.error });
    } else {
      return render(PageLoading);
    }
  },
};

export default FinishAxieLogin;
