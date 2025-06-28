import { useLoginWithEmail, usePrivy } from '@privy-io/react-auth';

import { useEffect, useMemo } from 'react';
import { PrivyCallbacks } from 'views/components/Privy/PrivyCallbacks';
import { useConnectedWallet } from 'views/components/Privy/useConnectedWallet';
import { usePrivyAuthEffect } from 'views/components/Privy/usePrivyAuthEffect';

export function usePrivyAuthWithEmail(props: PrivyCallbacks) {
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const privyAuthEffect = usePrivyAuthEffect(props);
  const { authenticated, user } = usePrivy();
  const wallet = useConnectedWallet();

  useEffect(() => {
    console.log('[DEBUG] usePrivyAuthWithEmail - effect triggered');
    console.log(
      '[DEBUG] usePrivyAuthWithEmail - authenticated:',
      authenticated,
      'wallet:',
      !!wallet,
    );
    console.log('[DEBUG] usePrivyAuthWithEmail - user:', user);
    console.log(
      '[DEBUG] usePrivyAuthWithEmail - user.email:',
      user?.email?.address,
    );
    console.log(
      '[DEBUG] usePrivyAuthWithEmail - user.google:',
      user?.google?.email,
    );

    // Only proceed with auth effect if user is authenticated AND wallet is available
    if (authenticated && wallet) {
      console.log(
        '[DEBUG] usePrivyAuthWithEmail - proceeding with privyAuthEffect for EMAIL',
      );

      // IMPORTANT: Check if this is actually an email login or if it's a Google login being misrouted
      if (user?.google?.email) {
        console.warn(
          '[DEBUG] usePrivyAuthWithEmail - WARNING: User has Google auth but email hook is being used!',
        );
        console.warn(
          '[DEBUG] usePrivyAuthWithEmail - This suggests the wrong authentication hook is being triggered',
        );
        return; // Don't proceed with email auth if it's actually Google
      }

      privyAuthEffect('email', undefined);
    } else if (authenticated && !wallet) {
      console.log(
        '[DEBUG] usePrivyAuthWithEmail - authenticated but no wallet yet, waiting...',
      );
      // The effect will re-run when wallet becomes available due to dependency array
    }
  }, [privyAuthEffect, authenticated, wallet, user]);

  return useMemo(() => {
    return {
      sendCode,
      loginWithCode,
    };
  }, [loginWithCode, sendCode]);
}
