import { useMobileRPCSender } from 'hooks/mobile/useMobileRPCSender';

type Input = {
  error?: string;
};

/**
 * Get privy to sign a message, in react-native, then return the message into
 * the browser.
 */
export function usePrivyMobileLogout() {
  return useMobileRPCSender<Input, {}>({ type: 'privy.logout' });
}
