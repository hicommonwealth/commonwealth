import { ChainBase, WalletId } from '@hicommonwealth/shared';
import { ConnectedWallet, usePrivy } from '@privy-io/react-auth';
import { PrivyEthereumWebWalletController } from 'controllers/app/webWallets/privy_ethereum_web_wallet';
import { getSessionFromWallet } from 'controllers/server/sessions';
import { useCallback, useRef } from 'react';
import { useSignIn } from 'state/api/user';
import { getPrivyActiveProvider } from 'views/components/Privy/privyActiveAuthStrategy';
import { PrivySignInSSOProvider } from 'views/components/Privy/types';
import { useIdentityTokenRef } from 'views/components/Privy/useIdentityTokenRef';
import { useSignMessageMemo } from 'views/components/Privy/useSignMessageMemo';

type UsePrivySignOnProps = {
  onSuccess: (address: string, isNewlyCreated: boolean) => void;
  onError: (err: Error) => void;
  wallet: ConnectedWallet;
  ssoOAuthToken: string | undefined;
  ssoProvider: PrivySignInSSOProvider;
};

export function usePrivySignOn() {
  const { signIn } = useSignIn();
  const signMessage = useSignMessageMemo();
  const identityTokenRef = useIdentityTokenRef();
  const { user: privyUser } = usePrivy();

  const authenticatingRef = useRef(false);

  return useCallback(
    async (props: UsePrivySignOnProps) => {
      const { wallet, ssoOAuthToken, ssoProvider, onSuccess } = props;

      if (ssoProvider !== getPrivyActiveProvider()) {
        console.log(
          `FIXME: wrong sso provider ${ssoProvider} vs ${getPrivyActiveProvider()}`,
        );
        return;
      }

      console.log(
        `FIXME: USING sso provider ${ssoProvider} vs ${getPrivyActiveProvider()}`,
      );

      console.log(
        'Authenticating with privy user: ' + JSON.stringify(privyUser, null, 2),
      );

      if (authenticatingRef.current) {
        console.log('Skipping duplicate authentication.');
      }

      // FIXME: I added a hack to try to figure out what was calling the hooks
      // over and over again but I couldn't figure out the source.
      authenticatingRef.current = true;

      try {
        const ethereumProvider = async () => {
          return await wallet.getEthereumProvider();
        };
        const signMessageProvider = async (
          message: string,
        ): Promise<string> => {
          const uiOptions = {
            title: 'Authenticate with Common',
          };

          const { signature } = await signMessage({ message }, { uiOptions });
          return signature;
        };

        const webWallet = new PrivyEthereumWebWalletController(
          ethereumProvider,
          signMessageProvider,
        );

        await webWallet.enable();
        const session = await getSessionFromWallet(webWallet, {
          newSession: true,
        });

        const { newlyCreated } = await signIn(session, {
          address: wallet.address,
          community_id: ChainBase.Ethereum,
          wallet_id: WalletId.Privy,
          privy: {
            identityToken: identityTokenRef.current!,
            ssoOAuthToken,
            ssoProvider,
          },
        });

        onSuccess(wallet.address, newlyCreated);
      } finally {
        authenticatingRef.current = false;
      }
    },
    [identityTokenRef, privyUser, signIn, signMessage],
  );
}
