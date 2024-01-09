import { handleSocialLoginCallback } from 'controllers/app/login';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useState } from 'react';
import app, { initAppState } from 'state';
import ErrorPage from 'views/pages/error';
import { PageLoading } from 'views/pages/loading';

const validate = async (setRoute) => {
  const params = new URLSearchParams(window.location.search);
  const chain = params.get('chain');
  const walletSsoSource = params.get('sso');
  let redirectTo = params.get('redirectTo');
  if (redirectTo?.startsWith('/finishsociallogin')) redirectTo = null;

  try {
    await handleSocialLoginCallback({ chain, walletSsoSource });
    await initAppState();

    if (redirectTo) {
      setRoute(redirectTo);
    } else if (chain && !app.isCustomDomain()) {
      setRoute(`/${chain}`);
    } else {
      setRoute('/');
    }
  } catch (error) {
    return `Error: ${error.message}`;
  }
};

const FinishSocialLogin = () => {
  const navigate = useCommonNavigate();
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    validate(navigate).catch((error) => {
      // useEffect will be called twice in development because of React strict mode,
      // causing an error to be displayed until validate() finishes
      if (document.location.host === 'localhost:8080') {
        return;
      }
      if (typeof error === 'string') {
        setValidationError(error);
      } else if (error && typeof error.message === 'string') {
        setValidationError(error.message);
      } else {
        setValidationError('Error logging in, please try again');
      }
    });
  }, [navigate]);

  if (validationError) {
    return <ErrorPage message={validationError} />;
  } else {
    return <PageLoading />;
  }
};

export default FinishSocialLogin;
