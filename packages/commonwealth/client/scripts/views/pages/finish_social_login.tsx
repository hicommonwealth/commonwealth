import React, { useEffect, useRef, useState } from 'react';
import { useCommonNavigate } from 'navigation/helpers';
import { PageLoading } from 'views/pages/loading';
import ErrorPage from 'views/pages/error';
import { handleSocialLoginCallback } from 'controllers/app/login';

const validate = async (setRoute) => {
  console.log('validating');
  try {
    await handleSocialLoginCallback();
    // TODO: add redirect from localstorage.
    setRoute('/dashboard');
  } catch (error) {
    return `Error: ${error.message}`;
  }
};

const FinishSocialLogin = () => {
  const navigate = useCommonNavigate();
  const didValidateRef = useRef(false);
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    // must use ref to avoid double-calling of magic side effect. Double calling is
    // due to React strict mode simulation.
    if (didValidateRef.current === false) {
      didValidateRef.current = true;
      validate(navigate).then((error) => {
        if (typeof error === 'string') {
          setValidationError(error);
        }
      });
    }
  }, []);

  if (validationError) {
    return <ErrorPage message={validationError} />;
  } else {
    return <PageLoading />;
  }
};

export default FinishSocialLogin;
