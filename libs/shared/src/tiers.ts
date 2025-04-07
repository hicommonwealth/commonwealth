type TierClientInfo = {
  trustLevel: 1 | 2 | 3 | 4 | 5;
  icon: string;
};

type TierRateLimits = {
  create: number;
  upvote: number;
  ai: {
    images: number;
    text: number;
  };
};

export interface Tier {
  name: string;
  description: string;
  clientInfo?: TierClientInfo;
}

export interface UserTier extends Tier {
  hourlyRateLimits?: TierRateLimits;
}

export enum UserTierMap {
  IncompleteUser = 0,
  BannedUser = 1,
  NewlyVerifiedWallet = 2,
  VerifiedWallet = 3,
  SocialVerified = 4,
  ChainVerified = 5,
  ManuallyVerified = 6,
}

export const USER_TIERS = {
  [UserTierMap.IncompleteUser]: {
    name: 'Incomplete User',
    description: 'User has not completed the sign-up process.',
    hourlyRateLimits: {
      create: 0,
      upvote: 0,
      ai: {
        images: 0,
        text: 0,
      },
    },
  },
  [UserTierMap.BannedUser]: {
    name: 'Banned User',
    description: 'User was banned.',
    hourlyRateLimits: {
      create: 0,
      upvote: 0,
      ai: {
        images: 0,
        text: 0,
      },
    },
  },
  [UserTierMap.NewlyVerifiedWallet]: {
    name: 'New Verified Wallet',
    description: 'Verified wallet younger than 1 week',
    clientInfo: {
      trustLevel: 1,
      icon: '🐣',
    },
    hourlyRateLimits: {
      create: 1,
      upvote: 5,
      ai: {
        images: 2,
        text: 5,
      },
    },
  },
  [UserTierMap.VerifiedWallet]: {
    name: 'Verified Wallet',
    description: 'Verified wallet older than 1 week',
    clientInfo: {
      trustLevel: 2,
      icon: '⌛',
    },
    hourlyRateLimits: {
      create: 2,
      upvote: 10,
      ai: {
        images: 4,
        text: 10,
      },
    },
  },
  [UserTierMap.SocialVerified]: {
    name: 'Social Verified',
    description: 'Basic verification through social media accounts.',
    clientInfo: {
      trustLevel: 3,
      icon: '🌐',
    },
    hourlyRateLimits: {
      create: 5,
      upvote: 25,
      ai: {
        images: 10,
        text: 50,
      },
    },
  },
  [UserTierMap.ChainVerified]: {
    name: 'Chain Verified',
    description: 'Creator of a namespace, contest, or launchpad token.',
    clientInfo: {
      trustLevel: 4,
      icon: '🔗',
    },
  },
  [UserTierMap.ManuallyVerified]: {
    name: 'Manual Verification',
    description: 'Manually reviewed and verified by our team',
    clientInfo: {
      trustLevel: 5,
      icon: '⭐',
    },
  },
} as const satisfies Record<UserTierMap, UserTier>;

export enum CommunityTierMap {
  SpamCommunity = 0,
  Unverified = 1,
  SocialVerified = 2,
  CommunityVerified = 3,
  ManuallyVerified = 4,
  PremiumVerification = 5,
}

export const COMMUNITY_TIERS = {
  [CommunityTierMap.SpamCommunity]: {
    name: 'Spam Community',
    description: 'Community struck by the Spam Hammer.',
  },
  [CommunityTierMap.Unverified]: {
    name: 'Unverified',
    description: 'Basic community without verification.',
    clientInfo: {
      trustLevel: 1,
      icon: '🚫',
    },
  },
  [CommunityTierMap.SocialVerified]: {
    name: 'Social Verified',
    description: 'Basic verification through social media accounts.',
    clientInfo: {
      trustLevel: 2,
      icon: '🌐',
    },
  },
  [CommunityTierMap.CommunityVerified]: {
    name: 'Community Verified',
    description: 'Ownership of verified community or domain',
    clientInfo: {
      trustLevel: 3,
      icon: '🔗',
    },
  },
  [CommunityTierMap.ManuallyVerified]: {
    name: 'Manual Verification',
    description: 'Manually reviewed and verified by our team',
    clientInfo: {
      trustLevel: 4,
      icon: '✅',
    },
  },
  [CommunityTierMap.PremiumVerification]: {
    name: 'Premium Verification',
    description: 'Highest level of trust with additional benefits.',
    clientInfo: {
      trustLevel: 5,
      icon: '⭐',
    },
  },
} as const satisfies Record<CommunityTierMap, Tier>;

export type UserTierLevels = keyof typeof USER_TIERS;
export type CommunityTierLevels = keyof typeof COMMUNITY_TIERS;

export type TierWithRateLimits = UserTierLevels &
  {
    [K in UserTierLevels]: (typeof USER_TIERS)[K] extends {
      hourlyRateLimits: TierRateLimits;
    }
      ? K
      : never;
  }[UserTierLevels];

export function hasTierRateLimits(
  tier: UserTierLevels,
): tier is TierWithRateLimits {
  return 'hourlyRateLimits' in USER_TIERS[tier];
}

export type TierWithClientInfo = UserTierLevels &
  {
    [K in UserTierLevels]: (typeof USER_TIERS)[K] extends {
      clientInfo: TierClientInfo;
    }
      ? K
      : never;
  }[UserTierLevels];

export function hasTierClientInfo(
  tier: UserTierLevels,
): tier is TierWithClientInfo {
  return 'clientInfo' in USER_TIERS[tier];
}
