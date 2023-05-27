import React, { useEffect, useState } from 'react';
import { useCommonNavigate } from 'navigation/helpers';
import { PageLoading } from 'views/pages/loading';
import ErrorPage from 'views/pages/error';
import { handleSocialLoginCallback, setActiveAccount } from 'controllers/app/login';
import { initAppState } from 'state';
import app from 'state';
import Account from 'models/Account';

const hasExecutedFinishSocialLogin = {};

const validate = async (setRoute) => {
  let redirectTo = (new URLSearchParams(window.location.search)).get('redirectTo');
  if (redirectTo?.startsWith("/finishsociallogin")) {
    redirectTo = null;
  }

  const magicAddress = await handleSocialLoginCallback();
  await initAppState();

  setRoute(redirectTo || (app.activeChainId() ? `/account/${app.activeChainId()}` : '/dashboard'));
  setTimeout(() => {
    // If we've redirected back into a community, link the new address
    if (app.chain && !app.user.activeAccounts.find((a) => a.address === magicAddress)) {
      const address = app.user.addresses.find((a) => a.address === magicAddress); // & a.chain = magic login'ed chain?
      const newAccount = new Account({
        addressId: address.id,
        address: address.address,
        chain: app.chain.meta,
        // sessionPublicAddress = ?
        // validationBlockInfo = ?
      });
      setActiveAccount(newAccount)
    }
  }, 100);
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
