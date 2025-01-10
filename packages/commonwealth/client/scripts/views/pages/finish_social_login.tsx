import { handleSocialLoginCallback } from 'controllers/app/login';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useState } from 'react';
import { initAppState } from 'state';
import { useFetchCustomDomainQuery } from 'state/api/configuration';
import useUserStore from 'state/ui/user';
import ErrorPage from 'views/pages/error';
import { PageLoading } from 'views/pages/loading';

export const validateSocialLogin = async (
  setRoute: (route: string) => void,
  isLoggedIn: boolean,
  isCustomDomain?: boolean,
) => {
  // localstorage for magic v2
  let chain = localStorage.getItem('magic_chain');
  let walletSsoSource = localStorage.getItem('magic_provider');
  // this redirect_to contains the whole url
  let redirectTo = localStorage.getItem('magic_redirect_to');

  localStorage.removeItem('chain');
  localStorage.removeItem('provider');
  localStorage.removeItem('redirectTo');

  // params for magic v1, only used for custom domains
  const params = new URLSearchParams(window.location.search);
  const isMagicV1 =
    params.get('chain') || params.get('sso') || params.get('redirectTo');
  if (isMagicV1) {
    chain = params.get('chain');
    walletSsoSource = params.get('sso');
    // this redirect_to contains the only the path after the domain
    redirectTo = params.get('redirectTo');
  }

  if (redirectTo?.startsWith('/finishsociallogin')) redirectTo = null;

  try {
    await handleSocialLoginCallback({
      // @ts-expect-error <StrictNullChecks/>
      chain,
      // @ts-expect-error <StrictNullChecks/>
      walletSsoSource,
      isLoggedIn,
      isCustomDomain,
    });

    if (isMagicV1) {
      await initAppState();

      if (redirectTo) {
        setRoute(redirectTo);
      } else if (chain && !isCustomDomain) {
        setRoute(`/${chain}`);
      } else {
        setRoute('/');
      }
    }

    const redirectToUrl = new URL(redirectTo!);
    if (!isCustomDomain) {
      setRoute(redirectToUrl.pathname);
    } else if (redirectTo) {
      window.location.href = redirectTo;
    } else {
      setRoute(`/${chain}`);
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
    validateSocialLogin(
      navigate,
      user.isLoggedIn,
      domain?.isCustomDomain,
    ).catch((error) => {
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
  }, [domain?.isCustomDomain, navigate, user.isLoggedIn]);

  if (validationError) {
    return <ErrorPage message={validationError} />;
  } else {
    return <PageLoading />;
  }
};

export default FinishSocialLogin;
