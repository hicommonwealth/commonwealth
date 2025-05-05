import { WalletSsoSource } from '@hicommonwealth/shared';
import { useCallback, useEffect, useState } from 'react';
import { messageToObject } from './utils';

/**
 * When the user is authenticated, this provides the data the user needs to
 * authenticate.
 */
export interface UserAuth {
  /**
   * The privy id which we're providing for debug info.  It's not normally used
   * otherwise.
   */
  id: string;
  address: string | null;
  identityToken: string;
  ssoOAuthToken: string;
  ssoProvider: WalletSsoSource;
}

export interface IPrivyAuthStatus {
  enabled: boolean;
  authenticated: boolean;
  userAuth: UserAuth | null;
}

export function usePrivyAuthStatus(): IPrivyAuthStatus | null {
  const [status, setStatus] = useState<IPrivyAuthStatus | null>(null);

  const handleMessage = useCallback((message: MessageEvent) => {
    const obj = messageToObject(message.data);
    if (obj && typeof message.data === 'object') {
      if (isPrivyAuthStatusMessage(obj)) {
        setStatus(obj.data);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleMessage]);

  return status;
}

type PrivyAuthStatusMessage = {
  type: 'privy.auth-status';
  data: IPrivyAuthStatus;
};

function isPrivyAuthStatusMessage(
  data: object,
): data is PrivyAuthStatusMessage {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!data && (data as any).type === 'privy.auth-status';
}
