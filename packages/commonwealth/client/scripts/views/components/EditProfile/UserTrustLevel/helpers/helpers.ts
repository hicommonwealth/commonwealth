import { UserProfileViewType } from '@hicommonwealth/schemas';
import {
  Tier,
  USER_TIERS,
  UserTierMap,
  UserVerificationItem,
  UserVerificationItemType,
} from '@hicommonwealth/shared';

type Status = 'Done' | 'Not Started';

interface TierInfo {
  tier: UserTierMap;
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

export const getLevelStatus = (
  user: UserProfileViewType,
  currentTier: UserTierMap,
): Status => {
  if (currentTier === UserTierMap.VerifiedWallet) {
    return user.wallet_verified ? 'Done' : 'Not Started';
  } else if (currentTier === UserTierMap.SocialVerified) {
    return user.social_verified ? 'Done' : 'Not Started';
  } else if (currentTier === UserTierMap.ChainVerified) {
    return user.chain_verified ? 'Done' : 'Not Started';
  } else if (currentTier === UserTierMap.NewlyVerifiedWallet) {
    return 'Done';
  } else if (currentTier === UserTierMap.ManuallyVerified) {
    return user.tier === UserTierMap.ManuallyVerified ? 'Done' : 'Not Started';
  } else if (currentTier === UserTierMap.FullyVerified) {
    return user.wallet_verified &&
      user.social_verified &&
      user.chain_verified &&
      user.tier === UserTierMap.FullyVerified
      ? 'Done'
      : 'Not Started';
  } else {
    return 'Not Started';
  }
};

export const mapTiers = (user: UserProfileViewType): TierInfo[] => {
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
        tier: tierNum,
        level: tierWithClientInfo.clientInfo?.trustLevel || 0,
        title: tier.name,
        description: tier.description,
        status: getLevelStatus(user, parseInt(key) as UserTierMap),
        items: tierWithClientInfo.clientInfo?.verificationItems
          ? Object.values(tierWithClientInfo.clientInfo.verificationItems).map(
              (item) => ({
                ...item,
                status: getLevelStatus(user, parseInt(key) as UserTierMap),
              }),
            )
          : [],
        redirect: getLevelRedirect(tierNum),
      };
    })
    .sort((a, b) => a.level - b.level);
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
