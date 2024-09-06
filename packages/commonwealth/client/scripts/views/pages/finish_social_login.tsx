import { handleSocialLoginCallback } from 'controllers/app/login';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useState } from 'react';
import { initAppState } from 'state';
import { useFetchCustomDomainQuery } from 'state/api/configuration';
import useUserStore from 'state/ui/user';
import ErrorPage from 'views/pages/error';
import { PageLoading } from 'views/pages/loading';

const validate = async (
  setRoute: (route: string) => void,
  isLoggedIn: boolean,
  isCustomDomain?: boolean,
) => {
  const params = new URLSearchParams(window.location.search);
  const chain = params.get('chain');
  const walletSsoSource = params.get('sso');
  let redirectTo = params.get('redirectTo');
  if (redirectTo?.startsWith('/finishsociallogin')) redirectTo = null;

  try {
    await handleSocialLoginCallback({
      // @ts-expect-error <StrictNullChecks/>
      chain,
      // @ts-expect-error <StrictNullChecks/>
      walletSsoSource,
      isLoggedIn,
    });
    await initAppState();

    if (redirectTo) {
      setRoute(redirectTo);
    } else if (chain && !isCustomDomain) {
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
  const user = useUserStore();
  const { data: domain } = useFetchCustomDomainQuery();

  useEffect(() => {
    validate(navigate, user.isLoggedIn, domain?.isCustomDomain).catch(
      (error) => {
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
      },
    );
  }, [domain?.isCustomDomain, navigate, user.isLoggedIn]);

  if (validationError) {
    return <ErrorPage message={validationError} />;
  } else {
    return <PageLoading />;
  }
};

export default FinishSocialLogin;
