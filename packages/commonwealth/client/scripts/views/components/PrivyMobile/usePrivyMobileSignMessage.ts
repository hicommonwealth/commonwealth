import { execWithinMobileApp } from 'hooks/useReactNativeWebView';
import { useCallback } from 'react';

/**
 * Get privy to sign a message, in react-native, then return the message into
 * the browser.
 */
export function usePrivyMobileSignMessage() {
  return useCallback(async (message: string): Promise<string> => {
    const result = await execWithinMobileApp({
      type: 'privy.sign_message',
      data: { message },
    });
    return (result as any).signature;
  }, []);
}
