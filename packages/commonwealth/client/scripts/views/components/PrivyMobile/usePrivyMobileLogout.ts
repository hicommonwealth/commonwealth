import { useMobileRPCSender } from 'hooks/mobile/useMobileRPCSender';

/**
 * Get privy to sign a message, in react-native, then return the message into
 * the browser.
 */
export function usePrivyMobileLogout() {
  return useMobileRPCSender<{}, {}>({ type: 'privy.logout' });
}
