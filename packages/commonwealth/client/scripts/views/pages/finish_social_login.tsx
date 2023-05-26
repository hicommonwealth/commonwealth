import React, { useEffect, useState } from 'react';
import { useCommonNavigate } from 'navigation/helpers';
import { PageLoading } from 'views/pages/loading';
import ErrorPage from 'views/pages/error';
import { handleSocialLoginCallback } from 'controllers/app/login';
import { initAppState } from 'state';
import app from 'state';

const hasExecutedFinishSocialLogin = {};

const validate = async (setRoute) => {
  let redirectTo = (new URLSearchParams(window.location.search)).get('redirectTo');
  if (redirectTo?.startsWith("/finishsociallogin")) {
    redirectTo = null;
  }

  await handleSocialLoginCallback();
  await initAppState();

  if (app.activeChainId()) {
    setRoute(redirectTo || `/account/${app.activeChainId()}`);
  } else {
    setRoute(redirectTo || '/dashboard');
  }
};

const FinishSocialLogin = () => {
  const navigate = useCommonNavigate();
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    validate(navigate).catch((error) => {
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
