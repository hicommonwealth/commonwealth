export type PrivySignInSSOProvider = 'email' | 'phone' | 'google_oauth';

export type OAuthProvider =
  | 'google'
  | 'github'
  | 'discord'
  | 'twitter'
  | 'apple';

export type PrivyOAuthProvider =
  | 'google'
  | 'discord'
  | 'twitter'
  | 'github'
  | 'spotify'
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'apple';

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
