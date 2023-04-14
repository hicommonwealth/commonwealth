import { updateActiveAddresses } from 'controllers/app/login';
import $ from 'jquery';
import { _DEPRECATED_getSearchParams } from 'mithrilInterop';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useState } from 'react';
import type { NavigateOptions, To } from 'react-router';

import app, { initAppState } from 'state';
import { PageLoading } from 'views/pages/loading';
import ErrorPage from './error';

// creates address, initializes account, and redirects to main page
const validate = async (
  token: string,
  stateId: string,
  chain: string,
  setRoute: (url: To, options?: NavigateOptions, prefix?: null | string) => void
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

const FinishAxieLogin = () => {
  const [error, setError] = useState('');
  const navigate = useCommonNavigate();

  const token = _DEPRECATED_getSearchParams('token');
  const stateId = _DEPRECATED_getSearchParams('stateId');

  useEffect(() => {
    validate(token, stateId, 'axie-infinity', navigate).then((res) => {
      if (typeof res === 'string') {
        setError(res);
      }
    });
  }, []);

  console.log('finish axie login');

  if (error) {
    return <ErrorPage title="Login Error" message={error} />;
  } else {
    return <PageLoading />;
  }
};

export default FinishAxieLogin;
