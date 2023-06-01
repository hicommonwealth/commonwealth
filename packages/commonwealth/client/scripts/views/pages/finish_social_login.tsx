import React, { useEffect, useState } from 'react';
import { useCommonNavigate } from 'navigation/helpers';
import { PageLoading } from 'views/pages/loading';
import ErrorPage from 'views/pages/error';
import { handleSocialLoginCallback } from 'controllers/app/login';
import { initAppState } from 'state';
import app from 'state';

const validate = async (setRoute) => {
  try {
    await handleSocialLoginCallback();
    await initAppState();
    if (app.activeChainId()) {
      setRoute(`/account/${app.activeChainId()}`);
    } else {
      setRoute('/dashboard');
    }
  } catch (error) {
    return `Error: ${error.message}`;
  }
};

const FinishSocialLogin = () => {
  const navigate = useCommonNavigate();
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    validate(navigate).then((error) => {
      if (typeof error === 'string') {
        setValidationError(error);
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
