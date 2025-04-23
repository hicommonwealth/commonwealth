import { useLoginWithSms } from '@privy-io/react-auth';

import { useEffect, useMemo } from 'react';
import { PrivyCallbacks } from 'views/components/PrivyTest/PrivyCallbacks';
import { usePrivyAuthEffect } from 'views/components/PrivyTest/usePrivyAuthEffect';

export function usePrivyAuthWithSMS(props: PrivyCallbacks) {
  const { sendCode, loginWithCode } = useLoginWithSms();
  const privyAuthEffect = usePrivyAuthEffect(props);

  useEffect(() => {
    privyAuthEffect('phone', undefined);
  }, [privyAuthEffect]);

  return useMemo(() => {
    return {
      sendCode,
      loginWithCode,
    };
  }, [loginWithCode, sendCode]);
}
