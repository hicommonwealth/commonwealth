import { WalletSsoSource } from '@hicommonwealth/shared';
import {
  OAuthProvider,
  PrivySignInSSOProvider,
} from 'views/components/Privy/types';

export function toSignInProvider(
  provider: WalletSsoSource | OAuthProvider,
): PrivySignInSSOProvider {
  switch (provider) {
    case 'google':
      return 'google_oauth';
    case 'github':
      return 'github_oauth';
    case 'discord':
      return 'discord_oauth';
    case 'twitter':
      return 'twitter_oauth';
    case 'apple':
      return 'apple_oauth';
    case 'email':
      return 'email';
    case 'farcaster':
      return 'farcaster';
    case 'SMS':
      return 'phone';
    default:
      throw new Error('Not supported: ' + provider);
  }
}
