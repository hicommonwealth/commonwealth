import { handleSocialLoginCallback } from 'controllers/app/login';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useState } from 'react';
import useUserStore from 'state/ui/user';
import ErrorPage from 'views/pages/error';
import { PageLoading } from 'views/pages/loading';

const validate = async (
  setRoute: (route: string) => void,
  isLoggedIn: boolean,
) => {
  const chain = localStorage.getItem('magic_chain');
  const walletSsoSource = localStorage.getItem('magic_provider');
  let redirectTo = localStorage.getItem('magic_redirect_to');

  localStorage.removeItem('chain');
  localStorage.removeItem('provider');
  localStorage.removeItem('redirectTo');

  if (redirectTo?.startsWith('/finishsociallogin')) redirectTo = null;

  try {
    await handleSocialLoginCallback({
      // @ts-expect-error <StrictNullChecks/>
      chain,
      // @ts-expect-error <StrictNullChecks/>
      walletSsoSource,
      isLoggedIn,
    });

    const currentDomain = window.location.hostname;
    const redirectToUrl = new URL(redirectTo!);
    const redirectToDomain = redirectToUrl.hostname;
    const isCustomDomain = currentDomain !== redirectToDomain;

    if (!isCustomDomain) {
      setRoute(redirectToUrl.pathname);
    } else {
      window.location.href = redirectTo!;
    }
  } catch (error) {
    return `Error: ${error.message}`;
  }
};

const FinishSocialLogin = () => {
  const navigate = useCommonNavigate();
  const [validationError, setValidationError] = useState<string>('');
  const user = useUserStore();

  useEffect(() => {
    validate(navigate, user.isLoggedIn).catch((error) => {
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
  }, [navigate, user.isLoggedIn]);

  if (validationError) {
    return <ErrorPage message={validationError} />;
  } else {
    return <PageLoading />;
  }
};

export default FinishSocialLogin;
