import type { ReactNativeWebView } from 'hooks/useReactNativeWebView';
import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    ReactNativeWebView?: ReactNativeWebView;
  }
}

type NavigateToLink = {
  type: 'navigate-to-link';
  link: string;
};

function isNavigateToLink(data: object): data is NavigateToLink {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any).type === 'navigate-to-link';
}

type NavigateBack = {
  type: 'navigate-back';
  link: string;
};

function isNavigateBack(data: object): data is NavigateBack {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any).type === 'navigate-back';
}

/**
 * Handles routing request on the frontend to new URLs from requests from
 * react-native
 */
export const ReactNativeBridgeRouter = () => {
  const navigate = useNavigate();

  const handleMessage = useCallback(
    (message: MessageEvent) => {
      const obj = messageToObject(message.data);
      if (obj && typeof message.data === 'object') {
        if (isNavigateToLink(obj)) {
          navigate(getPathAndQuery(obj.link));
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

  return null;
};

function messageToObject(message: string | object): object {
  return typeof message === 'string' ? JSON.parse(message) : message;
}

function getPathAndQuery(url: string): string {
  // only navigate with the path and query because we don't want to include
  // the host portion as a notification could be from the official common.xyz
  // site but we might be using frack for testing.
  const parsedUrl = new URL(url);
  return `${parsedUrl.pathname}${parsedUrl.search}`;
}
