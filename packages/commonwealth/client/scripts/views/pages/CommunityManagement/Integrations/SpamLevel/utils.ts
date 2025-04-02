export enum SpamLevels {
  Disabled = -1,
  Unverified = 0,
  OneWeekOld = 1,
  UsersWithIncompleteProfiles = 2,
}

export const SpamLevelOptions = [
  { label: 'Unverified users', value: SpamLevels.Unverified },
  {
    label: 'One week-old users with incomplete profiles',
    value: SpamLevels.OneWeekOld,
  },
  {
    label: 'Users with incomplete profiles',
    value: SpamLevels.UsersWithIncompleteProfiles,
  },
];
