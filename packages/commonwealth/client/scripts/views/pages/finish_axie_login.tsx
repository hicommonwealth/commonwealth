import { updateActiveAddresses } from 'controllers/app/login';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import $ from 'jquery';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import type { NavigateOptions, To } from 'react-router';
import { useSearchParams } from 'react-router-dom';
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
    return `Sign in Error: ${e.responseText}`;
  }
  if (result.status === 'Success') {
    await initAppState();
    const selectedChainMeta = app.config.chains.getById('axie-infinity');
    await updateActiveAddresses({ chain: selectedChainMeta });
    console.log('Navigating to axie infinite community');
    setRoute('/axie-infinity');
  } else {
    console.error(`Got sign in error: ${JSON.stringify(result)}`);
    return `Sign in error: ${JSON.stringify(result)}`;
  }
};

const FinishAxieLogin = () => {
  const [error, setError] = useState('');
  const navigate = useCommonNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');
  const stateId = searchParams.get('stateId');

  useNecessaryEffect(() => {
    validate(token, stateId, 'axie-infinity', navigate).then((res) => {
      if (typeof res === 'string') {
        setError(res);
      }
    });
  }, [navigate, stateId, token]);

  console.log('finish axie sign in');

  if (error) {
    return (
      <ErrorPage
        title="Sign in Error"
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
