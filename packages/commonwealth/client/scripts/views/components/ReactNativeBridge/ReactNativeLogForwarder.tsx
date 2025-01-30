import { useReactNativeWebView } from 'hooks/useReactNativeWebView';
import { memo, useEffect } from 'react';

export const ReactNativeLogForwarder = memo(function ReactNativeLogForwarder() {
  const reactNativeWebView = useReactNativeWebView();

  useEffect(() => {
    if (!reactNativeWebView) {
      return;
    }
    // Store original methods to restore later
    const originalConsoleLog = console.log;
    const originalConsoleInfo = console.info;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;

    // Override console methods
    console.log = (...args) => {
      originalConsoleLog(...args);
      forwardLog('log', args);
    };

    console.info = (...args) => {
      originalConsoleInfo(...args);
      forwardLog('info', args);
    };

    console.warn = (...args) => {
      originalConsoleWarn(...args);
      forwardLog('warn', args);
    };

    console.error = (...args) => {
      originalConsoleError(...args);
      forwardLog('error', args);
    };

    // Function to forward logs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const forwardLog = (level: string, args: any[]) => {
      reactNativeWebView.postMessage(
        JSON.stringify({
          type: 'log',
          data: {
            level,
            args,
          },
        }),
      );
    };

    // Cleanup on unmount
    return () => {
      console.log = originalConsoleLog;
      console.info = originalConsoleInfo;
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
    };
  }, [reactNativeWebView]);

  return null; // This component doesn't render anything
});
