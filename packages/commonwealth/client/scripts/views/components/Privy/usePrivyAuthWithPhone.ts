import { SendCodeToSms, useLoginWithSms, usePrivy } from '@privy-io/react-auth';

import { useCallback, useEffect, useMemo } from 'react';
import { setPrivyActiveProvider } from 'views/components/Privy/privyActiveAuthStrategy';
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

  const handleSendCode = useCallback(
    async (opts: SendCodeToSms) => {
      setPrivyActiveProvider('phone');
      await sendCode(opts);
    },
    [sendCode],
  );

  return useMemo(() => {
    return {
      sendCode: handleSendCode,
      loginWithCode,
    };
  }, [handleSendCode, loginWithCode]);
}
