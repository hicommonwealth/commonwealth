import { ConnectedWallet, usePrivy, useWallets } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import { useMemoizedFunction } from 'views/components/PrivyTest/useMemoizedFunction';

export function useConnectedWallet() {
  const wallets = useWallets();
  const privy = usePrivy();
  const createWallet = useMemoizedFunction(privy.createWallet);

  const [connectedWallet, setConnectedWallet] = useState<
    ConnectedWallet | undefined
  >();

  useEffect(() => {
    async function doAsync() {
      if (!privy.authenticated) {
        return;
      }

      if (wallets.ready) {
        if (wallets.wallets.length > 0 && !connectedWallet) {
          setConnectedWallet(wallets.wallets[0]);
        } else {
          // this should NOT happen, but the SDK is incorrect in the
          // documentation and will return with empty wallets sometimes, even
          // though they should automatically be created.
          try {
            await createWallet();
          } catch (e) {
            // we have to ignore this because if the wallets don't exist, we
            // have to try to create one but the hook doesn't behave properly,
            // so this will just throw an error. We should probably try to
            // fix this in the future.
          }
        }
      }
    }

    doAsync().catch(console.error);
  }, [
    connectedWallet,
    createWallet,
    privy.authenticated,
    wallets.ready,
    wallets.wallets,
    wallets.wallets.length,
  ]);

  return connectedWallet;
}
