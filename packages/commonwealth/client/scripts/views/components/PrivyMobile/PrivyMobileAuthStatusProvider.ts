import { useCallback, useEffect } from 'react';
import { IPrivyAuthStatus } from 'views/components/PrivyMobile/types';
import usePrivyMobileAuthStatusStore from 'views/components/PrivyMobile/usePrivyMobileAuthStatusStore';
import { messageToObject } from '../ReactNativeBridge/utils';

type Props = {
  children: React.ReactNode;
};

/**
 * This keeps the privy auth state, from the mobile app, using mobile privy,
 * available for use within the app.
 */
export const PrivyMobileAuthStatusProvider = (props: Props) => {
  const { children } = props;
  const { setState } = usePrivyMobileAuthStatusStore();

  const handleMessage = useCallback(
    (message: MessageEvent) => {
      const obj = messageToObject(message.data);
      if (obj && typeof message.data === 'object') {
        if (isPrivyAuthStatusMessage(obj)) {
          setState({ status: obj.data });
        }
      }
    },
    [setState],
  );

  useEffect(() => {
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleMessage]);

  return children;
};

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
