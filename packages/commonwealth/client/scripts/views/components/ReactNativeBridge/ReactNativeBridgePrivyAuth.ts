import { usePrivyAuthStatus } from 'views/components/ReactNativeBridge/usePrivyAuthStatus';

/**
 * The main bridge that handles the privy auth flow in the client.
 */
export const ReactNativeBridgePrivyAuth = () => {
  const privyAuth = usePrivyAuthStatus();
};
