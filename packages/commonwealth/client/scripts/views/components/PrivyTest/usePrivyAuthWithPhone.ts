import { useLoginWithSms } from '@privy-io/react-auth';

import { useEffect, useMemo } from 'react';
import { PrivyCallbacks } from 'views/components/PrivyTest/PrivyCallbacks';
import { usePrivyAuthEffect } from 'views/components/PrivyTest/usePrivyAuthEffect';

export function usePrivyAuthWithPhone(props: PrivyCallbacks) {
  const { sendCode, loginWithCode } = useLoginWithSms();
  const privyAuthEffect = usePrivyAuthEffect(props);

  // FIXME: DO NOT export loginWithCode I think... do this in our own dialog
  // we're working on
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
