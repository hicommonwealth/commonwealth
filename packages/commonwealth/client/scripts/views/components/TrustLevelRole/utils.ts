import {
  COMMUNITY_TIERS,
  CommunityTierMap,
  hasTierClientInfo,
  TierIcons,
  USER_TIERS,
  UserTier,
} from '@hicommonwealth/shared';

const DEFAULT_ICON = 'stopSymbol';

interface TrustLevelResult {
  icon: TierIcons;
}

const hasCommunityClientInfo = (
  tier: (typeof COMMUNITY_TIERS)[keyof typeof COMMUNITY_TIERS],
): tier is (typeof COMMUNITY_TIERS)[keyof typeof COMMUNITY_TIERS] & {
  clientInfo: { trustLevel: number; componentIcon: TierIcons };
} => {
  return 'clientInfo' in tier && tier.clientInfo !== undefined;
};

export const getUserTrustLevel = (level?: number): TrustLevelResult => {
  if (!level) {
    return { icon: DEFAULT_ICON };
  }

  const userTierKey = level;

  if (!hasTierClientInfo(userTierKey)) {
    return { icon: DEFAULT_ICON };
  }

  const userTier = Object.values(USER_TIERS).find((tier: UserTier) => {
    return tier.clientInfo?.trustLevel === level;
  }) as UserTier & {
    clientInfo: { trustLevel: number; componentIcon: TierIcons };
  };

  if (!userTier) {
    return { icon: DEFAULT_ICON };
  }
  return { icon: userTier.clientInfo!.componentIcon || DEFAULT_ICON };
};

export const getCommunityTrustLevel = (level?: number): TrustLevelResult => {
  if (!level) {
    return { icon: DEFAULT_ICON };
  }

  const communityTierKey = level as CommunityTierMap;
  const communityTier = COMMUNITY_TIERS[communityTierKey];

  if (!hasCommunityClientInfo(communityTier)) {
    return { icon: DEFAULT_ICON };
  }

  return { icon: communityTier.clientInfo.componentIcon };
};
