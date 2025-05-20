import {
  COMMUNITY_TIERS,
  CommunityTierMap,
  hasCommunityTierClientInfo,
  Tier,
  UserVerificationItem,
} from '@hicommonwealth/shared';

export const mapTiers = (currentTier: number) => {
  return Object.entries(COMMUNITY_TIERS)
    .filter(([key]) => {
      const tier = COMMUNITY_TIERS[
        parseInt(key) as CommunityTierMap
      ] as Tier & {
        clientInfo?: { trustLevel: number };
      };
      return (
        hasCommunityTierClientInfo(parseInt(key) as CommunityTierMap) &&
        tier.clientInfo?.trustLevel
      );
    })
    .map(([key]) => {
      const tier = COMMUNITY_TIERS[
        parseInt(key) as CommunityTierMap
      ] as Tier & {
        clientInfo: {
          trustLevel: number;
          componentIcon: string;
          verificationItems?: Record<string, UserVerificationItem>;
        };
      };
      return {
        level: tier.clientInfo.trustLevel,
        title: tier.name,
        description: tier.description,
        status:
          tier.clientInfo.trustLevel <= currentTier ? 'Done' : 'Not Started',
        icon: tier.clientInfo.componentIcon,
        items: tier.clientInfo.verificationItems
          ? Object.values(tier.clientInfo.verificationItems)
          : [],
        redirect: false,
      };
    })
    .sort((a, b) => a.level - b.level);
};
