import { useLoginWithEmail } from '@privy-io/react-auth';

import { useEffect, useMemo } from 'react';
import { PrivyCallbacks } from 'views/components/PrivyTest/PrivyCallbacks';
import { usePrivyAuthEffect } from 'views/components/PrivyTest/usePrivyAuthEffect';

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
