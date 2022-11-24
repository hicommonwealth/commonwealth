import m from 'mithril';
import ClassComponent from 'class_component';
import $ from 'jquery';
import app from 'state';

import { PageLoading } from 'views/pages/loading';
import { initAppState } from 'app';
import { updateActiveAddresses } from 'controllers/app/login';
import ErrorPage from './error';

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
    m.route.set('/axie-infinity');
  } else {
    console.error(`Got login error: ${JSON.stringify(result)}`);
    return `Login error: ${JSON.stringify(result)}`;
  }
};

class FinishAxieLogin extends ClassComponent<Record<string, unknown>> {
  private validating: boolean;
  private error: string;

  public oninit(vnode) {
    // grab token
    // TODO: how to use state id?
    const token = m.route.param('token');
    const stateId = m.route.param('stateId');
    validate(token, stateId, 'axie-infinity').then((res) => {
      if (typeof res === 'string') {
        this.error = res;
        m.redraw();
      }
    });
  }
  public view(vnode) {
    console.log('finish axie login');
    if (this.error) {
      return m(ErrorPage, { title: 'Login Error', message: this.error });
    } else {
      return m(PageLoading);
    }
  },
};

export default FinishAxieLogin;
