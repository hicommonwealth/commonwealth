import React, { memo, useCallback } from 'react';

type Props = {
  children: React.ReactNode;
};

export const DebugPostMessage = memo(function DebugPostMessage(props: Props) {
  const { children } = props;
  const handler = useCallback((message: MessageEvent<any>) => {
    console.log('GOT POST MESSAGE' + message.data);
  }, []);

  useCallback(() => {
    window.addEventListener('message', handler);

    return () => {
      window.removeEventListener('message', handler);
    };
  }, [handler]);

  return children;
});
