import { COMMUNITY_TIER, USER_TIER } from '@hicommonwealth/schemas';

interface TrustLevel {
  level: number;
  icon: string;
  name: string;
  description: string;
}

export interface UserTrustLevel extends TrustLevel {}
export interface CommunityTrustLevel extends TrustLevel {}

const USER_TRUST_LEVELS: Record<number, UserTrustLevel> = {
  0: {
    level: 0,
    icon: '🚫',
    name: 'Unverified',
    description: 'Basic account without verification.',
  },
  1: {
    level: 1,
    icon: '🐣',
    name: 'Social Verified',
    description: 'Basic verification through social media accounts.',
  },
  2: {
    level: 2,
    icon: '⌛',
    name: 'Namespace Verified',
    description: 'Verified ownership of namespace or domain',
  },
  3: {
    level: 3,
    icon: '🌐',
    name: 'Manual Verification',
    description: 'Manually reviewed and verified by our team',
  },
  4: {
    level: 4,
    icon: '🔗',
    name: 'Premium Verification',
    description: 'Highest level of trust with additional benefits.',
  },
  5: {
    level: 5,
    icon: '⭐',
    name: 'Premium Verification',
    description: 'Highest level of trust with additional benefits.',
  },
};

const COMMUNITY_TRUST_LEVELS: Record<number, CommunityTrustLevel> = {
  0: {
    level: 0,
    icon: '🚫',
    name: 'Unverified',
    description: 'Basic community without verification.',
  },
  1: {
    level: 1,
    icon: '🌐',
    name: 'Social Verified',
    description: 'Basic verification through social media accounts.',
  },
  2: {
    level: 2,
    icon: '🔗',
    name: 'Community Verified',
    description: 'Ownership of verified community or domain',
  },
  3: {
    level: 3,
    icon: '✅',
    name: 'Manual Verification',
    description: 'Manually reviewed and verified by our team',
  },
  4: {
    level: 4,
    icon: '⭐',
    name: 'Premium Verification',
    description: 'Highest level of trust with additional benefits.',
  },
};

export const getUserTrustLevel = (tier?: number | null): UserTrustLevel => {
  if (tier === undefined || tier === null) {
    return USER_TRUST_LEVELS[0];
  }

  const validTier = USER_TIER.safeParse(tier).success ? tier : 0;
  return USER_TRUST_LEVELS[validTier] || USER_TRUST_LEVELS[0];
};

export const getCommunityTrustLevel = (
  tier?: number | null,
): CommunityTrustLevel => {
  if (tier === undefined || tier === null) {
    return COMMUNITY_TRUST_LEVELS[0];
  }

  const validTier = COMMUNITY_TIER.safeParse(tier).success ? tier : 0;
  return COMMUNITY_TRUST_LEVELS[validTier] || COMMUNITY_TRUST_LEVELS[0];
};
