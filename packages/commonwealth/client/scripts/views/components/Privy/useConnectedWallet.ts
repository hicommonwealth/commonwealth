import { ConnectedWallet, usePrivy, useWallets } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import { useMemoizedFunction } from 'views/components/Privy/useMemoizedFunction';

export function useConnectedWallet() {
  const wallets = useWallets();
  const privy = usePrivy();
  const createWallet = useMemoizedFunction(privy.createWallet);

  const [connectedWallet, setConnectedWallet] = useState<
    ConnectedWallet | undefined
  >();
  const [retryCount, setRetryCount] = useState(0);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);

  useEffect(() => {
    async function doAsync() {
      console.log(
        '[DEBUG] useConnectedWallet - privy.authenticated:',
        privy.authenticated,
      );
      console.log('[DEBUG] useConnectedWallet - privy.ready:', privy.ready);
      console.log('[DEBUG] useConnectedWallet - wallets.ready:', wallets.ready);
      console.log(
        '[DEBUG] useConnectedWallet - wallets.wallets.length:',
        wallets.wallets.length,
      );
      console.log(
        '[DEBUG] useConnectedWallet - wallets.wallets:',
        wallets.wallets,
      );
      console.log(
        '[DEBUG] useConnectedWallet - connectedWallet:',
        connectedWallet,
      );
      console.log(
        '[DEBUG] useConnectedWallet - isCreatingWallet:',
        isCreatingWallet,
      );
      console.log('[DEBUG] useConnectedWallet - retryCount:', retryCount);

      if (!privy.authenticated) {
        console.log(
          '[DEBUG] useConnectedWallet - not authenticated, returning',
        );
        return;
      }

      if (!privy.ready) {
        console.log('[DEBUG] useConnectedWallet - privy not ready yet');
        return;
      }

      if (!wallets.ready) {
        console.log('[DEBUG] useConnectedWallet - wallets not ready yet');
        return;
      }

      // If we already have a connected wallet, don't do anything
      if (connectedWallet) {
        console.log(
          '[DEBUG] useConnectedWallet - already have connected wallet',
        );
        return;
      }

      // If we're already in the process of creating a wallet, don't start another
      if (isCreatingWallet) {
        console.log('[DEBUG] useConnectedWallet - already creating wallet');
        return;
      }

      if (wallets.wallets.length > 0) {
        console.log(
          '[DEBUG] useConnectedWallet - setting connected wallet:',
          wallets.wallets[0],
        );
        setConnectedWallet(wallets.wallets[0]);
      } else {
        // Try to create a wallet if none exists
        console.log(
          '[DEBUG] useConnectedWallet - attempting to create wallet, attempt:',
          retryCount + 1,
        );
        setIsCreatingWallet(true);

        try {
          console.log('[DEBUG] useConnectedWallet - calling createWallet()');
          const newWallet = await createWallet();
          console.log(
            '[DEBUG] useConnectedWallet - createWallet returned:',
            newWallet,
          );

          // Force a refresh of the wallets state
          console.log(
            '[DEBUG] useConnectedWallet - waiting for wallet to appear in wallets array',
          );

          // Use a longer timeout and check multiple times
          let checkCount = 0;
          const maxChecks = 10;
          const checkWallets = () => {
            checkCount++;
            console.log(
              `[DEBUG] useConnectedWallet - checking wallets, attempt ${checkCount}/${maxChecks}, wallets.length: ${wallets.wallets.length}`,
            );

            if (wallets.wallets.length > 0) {
              console.log(
                '[DEBUG] useConnectedWallet - wallet found after creation:',
                wallets.wallets[0],
              );
              setConnectedWallet(wallets.wallets[0]);
              setIsCreatingWallet(false);
            } else if (checkCount < maxChecks) {
              setTimeout(checkWallets, 500); // Check every 500ms
            } else {
              console.error(
                '[DEBUG] useConnectedWallet - wallet created but not found in wallets array',
              );
              setIsCreatingWallet(false);
              // Try to retry the whole process
              if (retryCount < 3) {
                setTimeout(() => {
                  setRetryCount((prev) => prev + 1);
                }, 1000);
              }
            }
          };

          checkWallets();
        } catch (e) {
          console.error(
            '[DEBUG] useConnectedWallet - wallet creation failed:',
            e,
          );
          setIsCreatingWallet(false);

          // Retry up to 3 times with exponential backoff
          if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
            console.log(`[DEBUG] useConnectedWallet - retrying in ${delay}ms`);
            setTimeout(() => {
              setRetryCount((prev) => prev + 1);
            }, delay);
          } else {
            console.error(
              '[DEBUG] useConnectedWallet - max retries reached, giving up',
            );
          }
        }
      }
    }

    doAsync().catch(console.error);
  }, [
    connectedWallet,
    createWallet,
    privy.authenticated,
    privy.ready,
    wallets.ready,
    wallets.wallets,
    wallets.wallets.length,
    retryCount,
    isCreatingWallet,
  ]);

  // Reset retry count when authentication status changes
  useEffect(() => {
    if (!privy.authenticated) {
      setRetryCount(0);
      setConnectedWallet(undefined);
      setIsCreatingWallet(false);
    }
  }, [privy.authenticated]);

  return connectedWallet;
}
