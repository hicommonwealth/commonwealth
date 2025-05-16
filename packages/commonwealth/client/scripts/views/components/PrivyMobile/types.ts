import { WalletSsoSource } from '@hicommonwealth/shared';

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
  address: string | null;
  identityToken: string;
  ssoOAuthToken: string;
  ssoProvider: WalletSsoSource;
}

export interface IPrivyAuthStatus {
  enabled: boolean;
  authenticated: boolean;
  userAuth: UserAuth | null;
}
