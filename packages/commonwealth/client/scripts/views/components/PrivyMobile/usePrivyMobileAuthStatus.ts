import { WalletSsoSource } from '@hicommonwealth/shared';
import { useMobileRPCSender } from 'hooks/mobile/useMobileRPCSender';

/**
 * When the user is authenticated, this provides the data the user needs to
 * authenticate.
 */
export interface UserAuth {
  /**
   * The privy id which we're providing for debug info.  It's not normally used
   * otherwise.
   */
  id: string;
  address: string;
  identityToken: string;
  ssoOAuthToken: string;
  ssoProvider: WalletSsoSource;
}

export interface IPrivyMobileAuthStatus {
  enabled: boolean;
  authenticated: boolean;
  userAuth: UserAuth | null;
}

export function usePrivyMobileAuthStatus() {
  return useMobileRPCSender<{}, IPrivyMobileAuthStatus>({
    type: 'privy.authStatus',
  });
}
