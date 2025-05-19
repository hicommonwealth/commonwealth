import { ChainBase, WalletId } from '@hicommonwealth/shared';
import { PrivyEthereumWebWalletController } from 'controllers/app/webWallets/privy_ethereum_web_wallet';
import { getSessionFromWallet } from 'controllers/server/sessions';
import React, { ReactNode, useCallback, useEffect } from 'react';
import { useSignIn } from 'state/api/user';
import useUserStore from 'state/ui/user';
import { LoadingIndicatorScreen } from 'views/components/LoadingIndicatorScreen';
import { toSignInProvider } from 'views/components/Privy/helpers';
import { usePrivyEthereumWalletOn } from 'views/components/PrivyMobile/usePrivyEthereumWalletOn';
import { usePrivyEthereumWalletRequest } from 'views/components/PrivyMobile/usePrivyEthereumWalletRequest';
import { usePrivyMobileAuthStatus } from 'views/components/PrivyMobile/usePrivyMobileAuthStatus';
import { usePrivyMobileLogout } from 'views/components/PrivyMobile/usePrivyMobileLogout';
import { usePrivyMobileSignMessage } from 'views/components/PrivyMobile/usePrivyMobileSignMessage';

declare global {
  interface Window {
    PRIVY_MOBILE_ENABLED?: boolean;
  }
}

type Props = {
  children: ReactNode;
};

/**
 * Triggers authentication when privy mobile is enabled.
 */
export const PrivyMobileAuthenticator = (props: Props) => {
  const { children } = props;
  const getPrivyMobileAuthStatus = usePrivyMobileAuthStatus();
  const privyMobileLogout = usePrivyMobileLogout();

  const { signIn } = useSignIn();

  const user = useUserStore();

  const walletRequest = usePrivyEthereumWalletRequest();
  const walletOn = usePrivyEthereumWalletOn();
  const signMessage = usePrivyMobileSignMessage();

  const ethereumProvider = useCallback(async () => {
    return { request: walletRequest, on: walletOn };
  }, [walletOn, walletRequest]);

  const signMessageProvider = useCallback(
    async (message: string): Promise<string> => {
      return await signMessage(message);
    },
    [signMessage],
  );

  useEffect(() => {
    async function doAsync() {
      async function doLogin(): Promise<boolean> {
        if (!window.PRIVY_MOBILE_ENABLED) {
          // only attempt to authenticate when running in the mobile app and
          // privy is enabled.
          return false;
        }

        if (user.isLoggedIn) {
          // we're already authenticated so there's nothing to do...
          return false;
        }

        const privyMobileAuthStatus = await getPrivyMobileAuthStatus({});

        if (!privyMobileAuthStatus.enabled) {
          return false;
        }

        if (
          !privyMobileAuthStatus.authenticated ||
          !privyMobileAuthStatus.userAuth
        ) {
          return false;
        }

        const webWallet = new PrivyEthereumWebWalletController(
          ethereumProvider,
          signMessageProvider,
        );

        await webWallet.enable();

        const session = await getSessionFromWallet(webWallet, {
          newSession: true,
        });

        const ssoProvider = privyMobileAuthStatus.userAuth.ssoProvider
          ? toSignInProvider(privyMobileAuthStatus.userAuth.ssoProvider)
          : undefined;

        if (!ssoProvider) {
          console.warn(
            'Unable to compute the sign in ssoProvider for ' +
              privyMobileAuthStatus.userAuth.ssoProvider,
          );
        }

        const signInOpts = {
          address: privyMobileAuthStatus.userAuth.address,
          community_id: ChainBase.Ethereum,
          wallet_id: WalletId.Privy,
          privy: {
            identityToken: privyMobileAuthStatus.userAuth.identityToken,
            ssoOAuthToken: privyMobileAuthStatus.userAuth.ssoOAuthToken,
            ssoProvider,
          },
        };

        console.log(
          '=== GOING TO AUTHENTICATE with signInOpts: ' +
            JSON.stringify(signInOpts, null, 2),
        );

        await signIn(session, signInOpts);

        return true;
      }

      /**
       * Perform auth with exception handling.
       */
      async function login(): Promise<boolean> {
        try {
          return await doLogin();
        } catch (err) {
          console.error(
            'Could not perform authentication: ' + err.message,
            err,
          );
          privyMobileLogout({
            error: err.message ?? undefined,
          }).catch(console.error);
          return false;
        }
      }

      const authenticated = await login();

      if (authenticated) {
        // NOTE this section reloads the app so we have to break it out of the
        // main try/catch loop or when the page reloads we get weird/unusual
        // behavior.
        const landingURL = new URL(
          '/dashboard/for-you',
          window.location.href,
        ).toString();
        document.location.href = landingURL;
      }
    }

    doAsync().catch(console.error);
  }, [
    user,
    ethereumProvider,
    getPrivyMobileAuthStatus,
    signIn,
    signMessageProvider,
    privyMobileLogout,
  ]);

  if (!user.isLoggedIn && window.PRIVY_MOBILE_ENABLED) {
    return <LoadingIndicatorScreen />;
  }

  return children;
};
