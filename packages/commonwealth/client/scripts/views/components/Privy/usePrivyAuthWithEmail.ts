import { useLoginWithEmail } from '@privy-io/react-auth';

import { useEffect, useMemo } from 'react';
import { PrivyCallbacks } from 'views/components/Privy/PrivyCallbacks';
import { usePrivyAuthEffect } from 'views/components/Privy/usePrivyAuthEffect';

export function usePrivyAuthWithEmail(props: PrivyCallbacks) {
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const privyAuthEffect = usePrivyAuthEffect(props);

  useEffect(() => {
    privyAuthEffect('email', undefined);
  }, [privyAuthEffect]);

  return useMemo(() => {
    return {
      sendCode,
      loginWithCode,
    };
  }, [loginWithCode, sendCode]);
}
