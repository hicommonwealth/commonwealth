import React from 'react';

import { initAppState } from 'state';
import { updateActiveAddresses } from 'controllers/app/login';
import $ from 'jquery';
import app from 'state';
import { ClassComponent, getRouteParam, redraw } from 'mithrilInterop';

import { PageLoading } from 'views/pages/loading';
import ErrorPage from './error';
import withRouter from 'navigation/helpers';

interface IState {
  validating: boolean;
  error: string;
}

// creates address, initializes account, and redirects to main page
const validate = async (
  token: string,
  stateId: string,
  chain: string,
  setRoute: ClassComponent['setRoute']
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

class FinishAxieLoginComponent extends ClassComponent<Record<string, unknown>> {
  public state: IState = {
    validating: false,
    error: '',
  };

  public oninit() {
    // grab token
    // TODO: how to use state id?
    const token = getRouteParam('token');
    const stateId = getRouteParam('stateId');

    validate(token, stateId, 'axie-infinity', this.setRoute).then((res) => {
      if (typeof res === 'string') {
        this.state.error = res;
        redraw();
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

const FinishAxieLogin = withRouter(FinishAxieLoginComponent);

export default FinishAxieLogin;
