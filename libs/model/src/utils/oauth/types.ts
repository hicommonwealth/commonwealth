export type SsoProviders =
  | 'google'
  | 'github'
  | 'twitter'
  | 'discord'
  | 'apple'
  | 'sms'
  | 'email'
  | 'farcaster';

export type VerifiedUserInfo = {
  provider: SsoProviders;
  email?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  username?: string;
};
