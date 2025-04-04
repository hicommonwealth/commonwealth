export interface Tier {
  level: number;
  icon: string;
  name: string;
  description: string;
}

export interface UserTier extends Tier {
  hourlyRateLimits?: {
    create: number;
    upvote: number;
    ai: {
      images: number;
      text: number;
    };
  };
}

export const USER_TIERS = {
  0: {
    level: 0,
    icon: '🚫',
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
  1: {
    level: 1,
    icon: '🐣',
    name: 'New Verified Wallet',
    description: 'Verified wallet younger than 1 week',
    hourlyRateLimits: {
      create: 1,
      upvote: 5,
      ai: {
        images: 2,
        text: 5,
      },
    },
  },
  2: {
    level: 2,
    icon: '⌛',
    name: 'Verified Wallet',
    description: 'Verified wallet older than 1 week',
    hourlyRateLimits: {
      create: 2,
      upvote: 10,
      ai: {
        images: 4,
        text: 10,
      },
    },
  },
  3: {
    level: 3,
    icon: '🐣',
    name: 'Social Verified',
    description: 'Basic verification through social media accounts.',
    hourlyRateLimits: {
      create: 5,
      upvote: 25,
      ai: {
        images: 10,
        text: 50,
      },
    },
  },
  4: {
    level: 4,
    icon: '🔗',
    name: 'Chain Verified',
    description: 'Creator of a namespace, contest, or launchpad token.',
  },
  5: {
    level: 5,
    icon: '⭐',
    name: 'Manual Verification',
    description: 'Manually reviewed and verified by our team',
  },
} as const satisfies Record<number, UserTier>;

export const COMMUNITY_TIERS = {
  0: {
    level: 0,
    icon: '❌',
    name: 'Spam Community',
    description: 'Community struck by the Spam Hammer.',
  },
  1: {
    level: 0,
    icon: '🚫',
    name: 'Unverified',
    description: 'Basic community without verification.',
  },
  2: {
    level: 1,
    icon: '🌐',
    name: 'Social Verified',
    description: 'Basic verification through social media accounts.',
  },
  3: {
    level: 2,
    icon: '🔗',
    name: 'Community Verified',
    description: 'Ownership of verified community or domain',
  },
  4: {
    level: 3,
    icon: '✅',
    name: 'Manual Verification',
    description: 'Manually reviewed and verified by our team',
  },
  5: {
    level: 4,
    icon: '⭐',
    name: 'Premium Verification',
    description: 'Highest level of trust with additional benefits.',
  },
} as const satisfies Record<number, Tier>;

export type UserTierLevels = keyof typeof USER_TIERS;
export type CommunityTierLevels = keyof typeof COMMUNITY_TIERS;

export type TierWithRateLimits = UserTierLevels &
  {
    [K in UserTierLevels]: (typeof USER_TIERS)[K] extends {
      hourlyRateLimits: any;
    }
      ? K
      : never;
  }[UserTierLevels];

export function hasTierRateLimits(
  tier: UserTierLevels,
): tier is TierWithRateLimits {
  return 'hourlyRateLimits' in USER_TIERS[tier];
}
