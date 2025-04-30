import {
  Tier,
  USER_TIERS,
  UserTierMap,
  UserVerificationItemType,
} from '@hicommonwealth/shared';

export const getLevelRedirect = (tier: UserTierMap): boolean => {
  return [UserTierMap.SocialVerified, UserTierMap.ChainVerified].includes(tier);
};

export const getLevelStatus = (
  level: number,
  currentTier: number,
): 'Done' | 'Not Started' => {
  const tierEntry = Object.entries(USER_TIERS).find(([key]) => {
    const tier = USER_TIERS[parseInt(key) as UserTierMap] as Tier & {
      clientInfo?: { trustLevel: number };
    };
    return tier.clientInfo?.trustLevel === level;
  });

  if (!tierEntry) return 'Not Started';
  const tierNum = parseInt(tierEntry[0]) as UserTierMap;
  return tierNum <= currentTier ? 'Done' : 'Not Started';
};

export const getCommunityNavigation = (
  action: UserVerificationItemType,
  communityId: string | null,
): string => {
  if (!communityId) {
    switch (action) {
      case 'LAUNCH_COIN':
        return '/createTokenCommunity';
      case 'VERIFY_COMMUNITY':
      case 'COMPLETE_CONTEST':
        return '/createCommunity';
      default:
        return '/';
    }
  }

  switch (action) {
    case 'LAUNCH_COIN':
      return `/${communityId}/manage/integrations/token`;
    case 'VERIFY_COMMUNITY':
      return `/${communityId}/manage/integrations/stake`;
    case 'COMPLETE_CONTEST':
      return `/${communityId}/manage/contests`;
    default:
      return '/';
  }
};
