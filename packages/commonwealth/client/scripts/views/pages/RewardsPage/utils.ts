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

export const enum TabParam {
  referrals = 'referrals',
  wallet = 'wallet',
  quests = 'quests',
}

export const tabParamToMobileTab = {
  [TabParam.referrals]: MobileTabType.Referrals,
  [TabParam.wallet]: MobileTabType.WalletBalance,
  [TabParam.quests]: MobileTabType.Quests,
};

export const mobileTabParam = {
  [MobileTabType.Referrals]: 'referrals',
  [MobileTabType.WalletBalance]: 'wallet',
  [MobileTabType.Quests]: 'quests',
};

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

export const getInitialTab = () => {
  const params = new URLSearchParams(location.search);
  const tabParam = params.get('tab');

  if (!tabParam) {
    return TabParam.referrals;
  }

  return tabParamToMobileTab[tabParam];
};
