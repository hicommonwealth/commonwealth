import useUserStore from 'client/scripts/state/ui/user';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ReactNativeWebView {
  // allows us to send messages to ReactNative.
  postMessage: (message: string) => void;
}

declare global {
  interface Window {
    ReactNativeWebView?: ReactNativeWebView;
  }
}

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

type NavigateToLink = {
  type: 'navigate-to-link';
  link: string;
};

function isNavigateToLink(data: object): data is NavigateToLink {
  return (data as any).type === 'navigate-to-link';
}

type NavigateBack = {
  type: 'navigate-back';
  link: string;
};

function isNavigateBack(data: object): data is NavigateBack {
  return (data as any).type === 'navigate-back';
}

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
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const handleMessage = useCallback(
    (message: MessageEvent) => {
      const obj = messageToObject(message.data);
      if (obj && typeof message.data === 'object') {
        if (isNavigateToLink(obj)) {
          navigate(obj.link);
        }

        if (isNavigateBack(obj)) {
          navigate(-1);
        }
      }
    },
    [navigate],
  );

  useEffect(() => {
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleMessage]);

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

    if (window.ReactNativeWebView && userInfo) {
      // send the user information to react native now.
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    }
  }, [userInfo]);

  return null;
};

function messageToObject(message: string | object): object {
  return typeof message === 'string' ? JSON.parse(message) : message;
}
