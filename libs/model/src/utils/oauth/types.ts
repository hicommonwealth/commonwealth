export type SsoProviders =
  | 'google'
  | 'github'
  | 'twitter'
  | 'discord'
  | 'apple'
  | 'sms'
  | 'email'
  | 'farcaster';

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
    }
  | {
      provider: 'apple';
      email: string;
      emailVerified: false;
    }
  | {
      provider: 'sms';
      phoneNumber: string;
    }
  | {
      provider: 'email';
      email: string;
      emailVerified: true;
    }
  | {
      provider: 'farcaster';
    };
