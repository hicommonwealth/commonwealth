import useUserStore from 'client/scripts/state/ui/user';
import { handleSocialLoginCallback } from 'controllers/app/login';
import { useReactNativeWebView } from 'hooks/useReactNativeWebView';
import { useCallback, useEffect, useState } from 'react';

/**
 * Typed message so that the react-native client knows how to handel this message.
 *
 * This is teh standard pattern of how to handle postMessage with multiple uses.
 */
type TypedData<Data> = {
  type: string;
  data: Data;
};

/**
 * The actual user info that the client needs.
 */
type UserInfo = {
  userId: number;
  knockJWT: string;
  // darkMode: 'dark' | 'light';
};

/**
 * This acts as a bridge between the react-native client (mobile app) and our
 * webapp.  Notifications only work with a userId and the react-native client
 * doesn't do any auth or even know about auth.
 *
 * This way the webapp will send a message to the mobile app via the
 * window.ReactNativeWebView.postMessage client.
 *
 * Note that NOTHING will happen in our normal app otherwise.  It will track
 * the userInfo but not send it.
 */
export const ReactNativeBridgeUser = () => {
  const user = useUserStore();
  const reactNativeWebView = useReactNativeWebView();

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    if (user.id !== userInfo?.userId) {
      setUserInfo({
        userId: user.id,
        knockJWT: user.knockJWT,
      });
    }
  }, [user.id, user.knockJWT, userInfo?.userId]);

  useEffect(() => {
    const message: TypedData<UserInfo | null> = {
      type: 'user',
      data: userInfo,
    };

    if (reactNativeWebView && userInfo) {
      // send the user information to react native now.
      reactNativeWebView.postMessage(JSON.stringify(message));
    }
  }, [reactNativeWebView, userInfo]);

  const handleMessage = useCallback((message: MessageEvent) => {
    const obj = messageToObject(message.data);
    if (obj && typeof message.data === 'object') {
      if (isAuthRequest(obj)) {
        console.log('Handling auth request from react-native: ', obj);
        handleSocialLoginCallback({ bearer: obj.bearer }).catch(console.error);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage);

    if (reactNativeWebView) {
      reactNativeWebView.postMessage(JSON.stringify({ type: 'auth-ready' }));
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleMessage, reactNativeWebView]);

  return null;
};

type AuthRequest = {
  type: 'navigate-to-link';
  bearer: string;
};

function isAuthRequest(data: object): data is AuthRequest {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any).type === 'auth-request';
}

function messageToObject(message: string | object): object {
  return typeof message === 'string' ? JSON.parse(message) : message;
}
