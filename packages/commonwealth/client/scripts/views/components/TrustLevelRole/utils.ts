import {
  COMMUNITY_TIERS,
  CommunityTierMap,
  hasTierClientInfo,
  USER_TIERS,
  UserTierMap,
} from '@hicommonwealth/shared';

const DEFAULT_ICON = 'stopSymbol';
type ComponentIcon =
  | 'stopSymbol'
  | 'socialVerified'
  | 'sandClock'
  | 'globe'
  | 'pins'
  | 'whiteCheck'
  | 'starGolden';

interface TrustLevelResult {
  icon: ComponentIcon;
}

const hasCommunityClientInfo = (
  tier: (typeof COMMUNITY_TIERS)[keyof typeof COMMUNITY_TIERS],
): tier is (typeof COMMUNITY_TIERS)[keyof typeof COMMUNITY_TIERS] & {
  clientInfo: { trustLevel: number; componentIcon: ComponentIcon };
} => {
  return 'clientInfo' in tier && tier.clientInfo !== undefined;
};

export const getUserTrustLevel = (level: number): TrustLevelResult => {
  if (!level) {
    return { icon: DEFAULT_ICON };
  }

  const userTierKey = level as UserTierMap;

  if (!hasTierClientInfo(userTierKey)) {
    return { icon: DEFAULT_ICON };
  }

  const userTier = USER_TIERS[userTierKey];
  return { icon: userTier.clientInfo?.componentIcon || DEFAULT_ICON };
};

export const getCommunityTrustLevel = (level: number): TrustLevelResult => {
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
