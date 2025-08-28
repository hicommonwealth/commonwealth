import { USER_TIERS, UserTierMap } from '@hicommonwealth/shared';

export const GroupTrustLevelOptions = [
  {
    label: `${
      USER_TIERS[UserTierMap.NewlyVerifiedWallet].clientInfo.icon
    }: Members need to have a wallet at least 1 week old`,
    value: UserTierMap.NewlyVerifiedWallet,
  },
  {
    label: `${
      USER_TIERS[UserTierMap.VerifiedWallet].clientInfo.icon
    }: Members must have social account connected`,
    value: UserTierMap.VerifiedWallet,
  },
  {
    label: `${
      USER_TIERS[UserTierMap.SocialVerified].clientInfo.icon
    }: Members must have social account verified`,
    value: UserTierMap.SocialVerified,
  },
  {
    label: `${
      USER_TIERS[UserTierMap.ChainVerified].clientInfo.icon
    }: Members must have a chain event verified (i.e namespace, token, contest creator)`,
    value: UserTierMap.ChainVerified,
  },
  {
    label: `${
      USER_TIERS[UserTierMap.ManuallyVerified].clientInfo.icon
    }: Members must have a manual verification from Common`,
    value: UserTierMap.ManuallyVerified,
  },
];
