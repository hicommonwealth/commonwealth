import { ChainBase, WalletId } from '@hicommonwealth/shared';
import { ConnectedWallet } from '@privy-io/react-auth';
import { PrivyEthereumWebWalletController } from 'controllers/app/webWallets/privy_ethereum_web_wallet';
import { getSessionFromWallet } from 'controllers/server/sessions';
import { useCallback } from 'react';
import { useSignIn } from 'state/api/user';
import { useIdentityTokenRef } from 'views/components/PrivyTest/useIdentityTokenRef';
import { useSignMessageMemo } from 'views/components/PrivyTest/useSignMessageMemo';

type UsePrivySignOnProps = {
  onSuccess: (address: string, isNewlyCreated: boolean) => void;
  onError: (err: Error) => void;
  wallet: ConnectedWallet;
  ssoOAuthToken: string | undefined;
  ssoProvider: 'google_oauth' | 'phone' | 'email';
};

export function usePrivySignOn() {
  const { signIn } = useSignIn();
  const signMessage = useSignMessageMemo();
  const identityTokenRef = useIdentityTokenRef();

  // TODO: we should consider only signing on when there is no user store.

  return useCallback(
    async (props: UsePrivySignOnProps) => {
      const { wallet, ssoOAuthToken, ssoProvider, onSuccess } = props;

      const ethereumProvider = async () => await wallet.getEthereumProvider();
      const signMessageProvider = async (message: string): Promise<string> => {
        const uiOptions = {
          title: 'Authenticate',
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

      console.log('FIXME IN THEORY... calling onSuccess');

      onSuccess(wallet.address, newlyCreated);
    },
    [identityTokenRef, signIn, signMessage],
  );
}
