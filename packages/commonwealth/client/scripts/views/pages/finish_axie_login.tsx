/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import $ from 'jquery';

import app from 'state';
import { initAppState } from 'app';
import { PageLoading } from 'views/pages/loading';
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
    // Generate Canvas session key
    const canvasMessage = {
      loginTo: "/commonwealth",
      registerSessionAddress: result.user.Addresses[0].address,
      registerSessionDuration: 86400 * 1000,
      timestamp: Math.floor((new Date()).getTime() / 1000)
    };

    // Ask ronin wallet to sign canvas message
    const signature = await new Promise((resolve, reject) => {
      // @ts-ignore
      window.ronin.provider.sendAsync(
        {
          method: "eth_sign",
          id: 0,
          jsonrpc: '2.0',
          params: [
            result.user.Addresses[0].address,
            JSON.stringify(canvasMessage)
          ]
        },
        (error, response) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
    // Save the signature somewhere
    // Call app.sessions.updateSessionPayload with the payload and signature

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
  private state: IState = {
    validating: false,
    error: '',
  };

  public oninit() {
    // grab token
    // TODO: how to use state id?
    const token = m.route.param('token');
    const stateId = m.route.param('stateId');

    validate(token, stateId, 'axie-infinity').then((res) => {
      if (typeof res === 'string') {
        this.state.error = res;
        m.redraw();
      }
    });
  }

  public view() {
    console.log('finish axie login');
    if (this.state.error) {
      return <ErrorPage title="Login Error" message={this.state.error} />;
    } else {
      return <PageLoading />;
    }
  }
}

export default FinishAxieLogin;
