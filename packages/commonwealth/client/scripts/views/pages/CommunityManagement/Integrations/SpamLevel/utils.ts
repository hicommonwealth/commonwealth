import { USER_TIERS, UserTierMap } from '@hicommonwealth/shared';

export const SpamLevelOptions = [
  {
    label: `${
      USER_TIERS[UserTierMap.NewlyVerifiedWallet].clientInfo.icon
    }: Users with a wallet less than 1 week old will be flagged`,
    value: UserTierMap.NewlyVerifiedWallet,
  },
  {
    label: `${
      USER_TIERS[UserTierMap.SocialVerified].clientInfo.icon
    }: Users with no social account connected will be flagged`,
    value: UserTierMap.VerifiedWallet,
  },
];
