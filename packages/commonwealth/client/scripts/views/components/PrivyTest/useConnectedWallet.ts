import { ConnectedWallet, usePrivy, useWallets } from '@privy-io/react-auth';
import { useEffect, useRef, useState } from 'react';
import { useMemoizedFunction } from 'views/components/PrivyTest/useMemoizedFunction';

export function useConnectedWallet() {
  const wallets = useWallets();
  const walletsRef = useRef(wallets);
  walletsRef.current = wallets;
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

      if (walletsRef.current.ready) {
        if (walletsRef.current.wallets.length > 0) {
          setConnectedWallet(walletsRef.current.wallets[0]);
        } else {
          // this should NOT happen, but the SDK is incorrect in the
          // documentation and may have a bug.
          console.warn('No wallets ... manually creating one.');
          await createWallet();
        }
      }
    }

    doAsync().catch(console.error);
  }, [createWallet, privy.authenticated]);

  return connectedWallet;
}
