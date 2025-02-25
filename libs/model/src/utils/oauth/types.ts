export type SsoProviders = 'google' | 'github' | 'twitter' | 'discord';

export type VerifiedUserInfo =
  | {
      provider: 'twitter';
      username: string;
    }
  | {
      provider: 'discord';
      email: string;
      emailVerified: boolean;
      username: string;
    }
  | {
      provider: 'github';
      username: string;
    }
  | {
      provider: 'google';
      email: string;
      emailVerified: boolean;
    };
