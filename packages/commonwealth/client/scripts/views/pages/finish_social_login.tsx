import React, { useEffect, useState } from 'react';
import { useCommonNavigate } from 'navigation/helpers';
import { PageLoading } from 'views/pages/loading';
import ErrorPage from 'views/pages/error';
import { handleSocialLoginCallback } from 'controllers/app/login';
import app, { initAppState } from 'state';

const validate = async (setRoute) => {
  const params = new URLSearchParams(window.location.search);
  const chain = params.get('chain');

  try {
    await handleSocialLoginCallback();
    await initAppState();

    if (chain && !app.isCustomDomain()) {
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
