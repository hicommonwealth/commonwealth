import { useReactNativeWebView } from 'hooks/useReactNativeWebView';
import { useCallback, useMemo } from 'react';

export function useMobileLoginTrigger() {
  const reactNativeWebView = useReactNativeWebView();

  const enabled = reactNativeWebView !== null;

  const trigger = useCallback(() => {
    reactNativeWebView?.postMessage(
      JSON.stringify({
        type: 'auth-started',
      }),
    );
  }, [reactNativeWebView]);

  return useMemo(() => {
    return {
      enabled,
      trigger,
    };
  }, [enabled, trigger]);
}
