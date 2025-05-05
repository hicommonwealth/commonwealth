import { execWithinMobileApp } from 'hooks/useReactNativeWebView';
import { useCallback } from 'react';

type Opts = {
  message: string;
};

/**
 * Get privy to sign a message, in react-native, then return the message into
 * the browser.
 */
export function usePrivyMobileSignMessage() {
  return useCallback(async (opts: Opts) => {
    return await execWithinMobileApp({
      type: 'privy.sign_message',
      data: opts,
    });
  }, []);
}
