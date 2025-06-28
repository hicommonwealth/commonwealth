import { SendCodeToEmail, useLoginWithEmail } from '@privy-io/react-auth';

import { useCallback, useEffect, useMemo } from 'react';
import { setPrivyActiveProvider } from 'views/components/Privy/privyActiveAuthStrategy';
import { PrivyCallbacks } from 'views/components/Privy/PrivyCallbacks';
import { usePrivyAuthEffect } from 'views/components/Privy/usePrivyAuthEffect';

export function usePrivyAuthWithEmail(props: PrivyCallbacks) {
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const privyAuthEffect = usePrivyAuthEffect(props);

  useEffect(() => {
    privyAuthEffect('email', undefined);
  }, [privyAuthEffect]);

  const handleSendCode = useCallback(
    async (opts: SendCodeToEmail) => {
      setPrivyActiveProvider('email');
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
