import { WalletSsoSource } from '@hicommonwealth/shared';
import {
  OAuthProvider,
  PrivySignInSSOProvider,
} from 'views/components/Privy/types';

export function toSignInProvider(
  provider: WalletSsoSource | OAuthProvider | PrivySignInSSOProvider,
): PrivySignInSSOProvider {
  switch (provider) {
    case 'google':
    case 'google_oauth':
      return 'google_oauth';
    case 'github':
    case 'github_oauth':
      return 'github_oauth';
    case 'discord':
    case 'discord_oauth':
      return 'discord_oauth';
    case 'twitter':
    case 'twitter_oauth':
      return 'twitter_oauth';
    case 'apple':
    case 'apple_oauth':
      return 'apple_oauth';
    case 'email':
      return 'email';
    case 'farcaster':
      return 'farcaster';
    case 'SMS':
      return 'phone';
    default:
      throw new Error('toSignInProvider: Not supported: ' + provider);
  }
}
