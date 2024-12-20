export enum MobileTabType {
  Referrals = 'Refferal Earnings',
  WalletBalance = 'Wallet Balance',
  Quests = 'Quests',
}

export enum TableType {
  Referrals = 'Referrals',
  TokenTXHistory = 'Token TX History',
  XPEarnings = 'XP Earnings',
}

export const tabToTable = {
  [MobileTabType.Referrals]: TableType.Referrals,
  [MobileTabType.WalletBalance]: TableType.TokenTXHistory,
  [MobileTabType.Quests]: TableType.XPEarnings,
};

export const typeToIcon = {
  [MobileTabType.Referrals]: 'userSwitch',
  [MobileTabType.WalletBalance]: 'cardholder',
  [MobileTabType.Quests]: 'trophy',
};
