import {
  COMMUNITY_TIERS,
  CommunityTierMap,
  hasTierClientInfo,
  TierIcons,
  USER_TIERS,
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

export const getUserTrustLevelIcon = (tier?: number): TrustLevelResult => {
  if (!tier) {
    return { icon: DEFAULT_ICON };
  }
  if (!hasTierClientInfo(tier)) {
    return { icon: DEFAULT_ICON };
  }
  return { icon: USER_TIERS[tier].clientInfo!.componentIcon || DEFAULT_ICON };
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
