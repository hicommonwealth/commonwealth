import React, { memo, useCallback, useEffect } from 'react';

type Props = {
  children: React.ReactNode;
};

/**
 * Debugger which listens to all postMessage traffic which can help us debug
 * protocol issues between react-native and the browser.
 */
export const DebugPostMessage = memo(function DebugPostMessage(props: Props) {
  const { children } = props;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handler = useCallback((message: MessageEvent<any>) => {
    console.log('GOT POST MESSAGE' + JSON.stringify(message.data, null, 2));
  }, []);

  useEffect(() => {
    console.log('Listening for all post messages');
    window.addEventListener('message', handler);

    return () => {
      console.log('Removing post message listener');
      window.removeEventListener('message', handler);
    };
  }, [handler]);

  return children;
});
