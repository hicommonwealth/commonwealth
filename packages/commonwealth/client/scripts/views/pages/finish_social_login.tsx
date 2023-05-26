import React, { useEffect, useState } from 'react';
import { useCommonNavigate } from 'navigation/helpers';
import { PageLoading } from 'views/pages/loading';
import ErrorPage from 'views/pages/error';
import { handleSocialLoginCallback } from 'controllers/app/login';
import { initAppState } from 'state';
import app from 'state';

const validate = async (setRoute) => {
  if (window.location.search === '') {
    console.warn("Unexpected: magic login redirect should return some URL parameters")
  }
  await handleSocialLoginCallback(); // TODO: pass whether we're just revalidating the current user login into state, and pass it here
  await initAppState();

  // TODO: redirect to correct path
  if (app.activeChainId()) {
    setRoute(`/account/${app.activeChainId()}`);
  } else {
    setRoute('/dashboard');
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
        setValidationError("Error logging in, please try again");
      }
    });
  }, []);

  if (validationError) {
    return <ErrorPage message={validationError} />;
  } else {
    return <PageLoading />;
  }
};

export default FinishSocialLogin;
