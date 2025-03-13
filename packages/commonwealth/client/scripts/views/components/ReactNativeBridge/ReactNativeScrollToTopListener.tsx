import type { ReactNativeWebView } from 'hooks/useReactNativeWebView';
import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    ReactNativeWebView?: ReactNativeWebView;
  }
}

type ScrollToTop = {
  type: 'scroll-to-top';
  link: string;
};

function isScrollToTop(data: object): data is ScrollToTop {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any).type === 'scroll-to-top';
}

/**
 * Handles routing request on the frontend to new URLs from requests from
 * react-native
 */
export const ReactNativeScrollToTopListener = () => {
  const navigate = useNavigate();

  const handleMessage = useCallback(
    (message: MessageEvent) => {
      const obj = messageToObject(message.data);
      if (obj && typeof message.data === 'object') {
        if (isScrollToTop(obj)) {
          smoothScrollAllToTop();
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

function messageToObject(message: string | object): object | null {
  try {
    return typeof message === 'string' ? JSON.parse(message) : message;
  } catch (e) {
    // this could happen if another library is sending non-JSON data via
    // postMessage
    return null;
  }
}

function smoothScrollAllToTop() {
  // Scroll the window itself to the top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Scroll all scrollable elements to the top smoothly
  document.querySelectorAll('*').forEach((el) => {
    if (el.scrollHeight > el.clientHeight) {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}
