interface Tier {
  level: number;
  icon: string;
  name: string;
  description: string;
}

export const USER_TIERS = {
  0: {
    level: 0,
    icon: '🚫',
    name: 'Banned User',
    description: 'User was banned.',
  },
  1: {
    level: 1,
    icon: '🐣',
    name: 'New Verified Wallet',
    description: 'Verified wallet younger than 1 week',
  },
  2: {
    level: 2,
    icon: '⌛',
    name: 'Verified Wallet',
    description: 'Verified wallet older than 1 week',
  },
  3: {
    level: 3,
    icon: '🐣',
    name: 'Social Verified',
    description: 'Basic verification through social media accounts.',
  },
  4: {
    level: 4,
    icon: '🔗',
    name: 'Chain Verified',
    description: 'Creator of a namespace, contest, or launchpad token.',
  },
  5: {
    level: 3,
    icon: '⭐',
    name: 'Manual Verification',
    description: 'Manually reviewed and verified by our team',
  },
} as const satisfies Record<number, Tier>;

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
