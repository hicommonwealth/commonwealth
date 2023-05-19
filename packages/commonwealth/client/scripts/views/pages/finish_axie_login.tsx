import React, { useEffect, useState } from 'react';
import type { NavigateOptions, To } from 'react-router';
import $ from 'jquery';

import app from 'state';
import { initAppState } from 'state';
import { updateActiveAddresses } from 'controllers/app/login';
import { PageLoading } from 'views/pages/loading';
import ErrorPage from './error';
import { useCommonNavigate } from 'navigation/helpers';
import { useSearchParams } from 'react-router-dom';

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
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');
  const stateId = searchParams.get('stateId');

  useEffect(() => {
    validate(token, stateId, 'axie-infinity', navigate).then((res) => {
      if (typeof res === 'string') {
        setError(res);
      }
    });
  }, [navigate, stateId, token]);

  console.log('finish axie login');

  if (error) {
    return (
      <ErrorPage
        title="Login Error"
        message={
          <div>
            {error}
            <br />
            <br />
            <div>
              If this is your first time encountering this error, log out of{' '}
              <a href="https://app.axieinfinity.com">Ronin Wallet</a> and{' '}
              <a href="/axie-infinity">try logging in again</a>.
            </div>
          </div>
        }
      />
    );
  } else {
    return <PageLoading />;
  }
};

export default FinishAxieLogin;
