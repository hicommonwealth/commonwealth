import {
  OAuthProvider,
  PrivySignInSSOProvider,
} from 'views/components/Privy/types';

export function toSignInProvider(
  provider: OAuthProvider,
): PrivySignInSSOProvider {
  switch (provider) {
    case 'google':
      return 'google_oauth';
    default:
      throw new Error('Not supported: ' + provider);
  }
}
