import { useLoginWithSms, usePrivy } from '@privy-io/react-auth';

import { useEffect, useMemo } from 'react';
import { PrivyCallbacks } from 'views/components/Privy/PrivyCallbacks';
import { usePrivyAuthEffect } from 'views/components/Privy/usePrivyAuthEffect';

export function usePrivyAuthWithPhone(props: PrivyCallbacks) {
  const { authenticated } = usePrivy();
  const { sendCode, loginWithCode } = useLoginWithSms();
  const privyAuthEffect = usePrivyAuthEffect(props);

  useEffect(() => {
    if (authenticated) {
      privyAuthEffect('phone', undefined);
    }
  }, [privyAuthEffect, authenticated]);

  return useMemo(() => {
    return {
      sendCode,
      loginWithCode,
    };
  }, [loginWithCode, sendCode]);
}
