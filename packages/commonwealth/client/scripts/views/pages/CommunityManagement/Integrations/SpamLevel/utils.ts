export enum SpamLevels {
  Disabled = -1,
  Unverified = 0,
  OneWeekOld = 1,
  UsersWithIncompleteProfiles = 2,
}

export const SpamLevelOptions = [
  {
    label: '🚫: Users with unverified wallet will be flagged: ',
    value: SpamLevels.Unverified,
  },
  {
    label:
      '🐣: Users with no balance or social account (and below) will be flagged',
    value: SpamLevels.OneWeekOld,
  },
  {
    label:
      '⏳: Users with 1 week old account, no balance, or social account (and below) will be flagged',
    value: SpamLevels.UsersWithIncompleteProfiles,
  },
];
