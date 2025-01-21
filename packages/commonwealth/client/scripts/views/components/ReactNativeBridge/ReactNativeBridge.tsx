import useUserStore from 'client/scripts/state/ui/user';
import { useReactNativeWebView } from 'hooks/useReactNativeWebView';
import { useEffect, useState } from 'react';

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
export const ReactNativeBridge = () => {
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

  return null;
};
