import { Tier, USER_TIERS, UserTierMap } from '@hicommonwealth/shared';

type ComponentIcon =
  | 'stopSymbol'
  | 'socialVerified'
  | 'sandClock'
  | 'globe'
  | 'pins'
  | 'whiteCheck'
  | 'starGolden';

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

export const getTierIcon = (level: number): ComponentIcon | undefined => {
  const tierEntry = Object.entries(USER_TIERS).find(([key]) => {
    const tier = USER_TIERS[parseInt(key) as UserTierMap] as Tier & {
      clientInfo?: { trustLevel: number; componentIcon: ComponentIcon };
    };
    return tier.clientInfo?.trustLevel === level;
  });

  return tierEntry
    ? (
        USER_TIERS[parseInt(tierEntry[0]) as UserTierMap] as Tier & {
          clientInfo?: { componentIcon: ComponentIcon };
        }
      ).clientInfo?.componentIcon
    : undefined;
};
