import { ChainBase, WalletId } from '@hicommonwealth/shared';
import { PrivyEthereumWebWalletController } from 'controllers/app/webWallets/privy_ethereum_web_wallet';
import { getSessionFromWallet } from 'controllers/server/sessions';
import { ReactNode, useCallback, useEffect } from 'react';
import { useSignIn } from 'state/api/user';
import { toSignInProvider } from 'views/components/Privy/helpers';
import { usePrivyEthereumWalletOn } from 'views/components/PrivyMobile/usePrivyEthereumWalletOn';
import { usePrivyEthereumWalletRequest } from 'views/components/PrivyMobile/usePrivyEthereumWalletRequest';
import { usePrivyMobileAuthStatus } from 'views/components/PrivyMobile/usePrivyMobileAuthStatus';
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
  const { signIn } = useSignIn();

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
      const privyMobileAuthStatus = await getPrivyMobileAuthStatus({});

      console.log(
        'FIXME: privyMobileAuthStatus',
        JSON.stringify(privyMobileAuthStatus, null, 2),
      );

      if (!privyMobileAuthStatus.enabled) {
        console.log('FIXME: Privy mobile auth is not enabled');
        return;
      }

      if (
        !privyMobileAuthStatus.authenticated ||
        !privyMobileAuthStatus.userAuth
      ) {
        console.log('FIXME: Privy mobile not authenticated.');
        return;
      }

      console.log('FIXME: Privy mobile is authenticated so trying to sign in ');

      const webWallet = new PrivyEthereumWebWalletController(
        ethereumProvider,
        signMessageProvider,
      );

      console.log('FIXME enable web wallet... ');

      // FIXME this is the bug now - it's not logging though
      await webWallet.enable();

      console.log('FIXME getting session now.;');
      const session = await getSessionFromWallet(webWallet, {
        newSession: true,
      });

      console.log(
        'FIXME: Going to sign in now with privy mobile.  session: ',
        session,
      );

      console.log('FIXME: trying to sign in now... ');

      const auth = await signIn(session, {
        address: privyMobileAuthStatus.userAuth.address,
        community_id: ChainBase.Ethereum,
        wallet_id: WalletId.Privy,
        privy: {
          identityToken: privyMobileAuthStatus.userAuth.identityToken,
          ssoOAuthToken: privyMobileAuthStatus.userAuth.ssoOAuthToken,
          ssoProvider: toSignInProvider(
            privyMobileAuthStatus.userAuth.ssoProvider,
          ),
        },
      });

      console.log('FIXME signIn result: ' + JSON.stringify(auth, null, 2));
    }

    doAsync().catch(console.error);
  }, [ethereumProvider, getPrivyMobileAuthStatus, signIn, signMessageProvider]);

  if (!window.PRIVY_MOBILE_ENABLED) {
    console.log('FIXME: Privy mobile is not enabled.');
    return children;
  }
  console.log('FIXME: Privy mobile is ENABLED.');

  // FIXME: do not return until we've finished authenticating...
  // FIXME: can I use useUeerStore here ?

  return children;
};
