import {
  Tier,
  USER_TIERS,
  UserTierMap,
  UserVerificationItem,
  UserVerificationItemType,
} from '@hicommonwealth/shared';

type Status = 'Done' | 'Not Started';
interface TierInfo {
  level: number;
  title: string;
  description: string;
  status: Status;
  items: Array<UserVerificationItem & { status: Status }>;
  redirect: boolean;
}

export const getLevelRedirect = (tier: UserTierMap): boolean => {
  return [UserTierMap.SocialVerified, UserTierMap.ChainVerified].includes(tier);
};

export const getLevelStatus = (level: number, currentTier: number): Status => {
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

export const mapTiers = (currentTier: number): TierInfo[] => {
  return Object.entries(USER_TIERS)
    .filter(([key]) => {
      const tier = parseInt(key) as UserTierMap;
      return (
        tier >= UserTierMap.NewlyVerifiedWallet &&
        tier <= UserTierMap.ManuallyVerified
      );
    })
    .map(([key, tier]) => {
      const tierNum = parseInt(key) as UserTierMap;
      const tierWithClientInfo = tier as Tier & {
        clientInfo?: {
          trustLevel: number;
          verificationItems?: Record<string, UserVerificationItem>;
        };
      };
      return {
        level: tierWithClientInfo.clientInfo?.trustLevel || 0,
        title: tier.name,
        description: tier.description,
        status: getLevelStatus(
          tierWithClientInfo.clientInfo?.trustLevel || 0,
          currentTier,
        ),
        items: tierWithClientInfo.clientInfo?.verificationItems
          ? Object.values(tierWithClientInfo.clientInfo.verificationItems).map(
              (item) => ({
                ...item,
                status: getLevelStatus(
                  tierWithClientInfo.clientInfo?.trustLevel || 0,
                  currentTier,
                ),
              }),
            )
          : [],
        redirect: getLevelRedirect(tierNum),
      };
    })
    .sort((a, b) => a.level - b.level);
};
