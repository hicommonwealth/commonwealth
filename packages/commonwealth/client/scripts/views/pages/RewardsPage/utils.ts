import { ReferralView } from '@hicommonwealth/schemas';
import type { z } from 'zod';
import { MobileTabType, TableType, TabParam } from './types';

type Referral = z.infer<typeof ReferralView>;

export const calculateTotalEarnings = (referrals: Referral[]) => {
  if (!referrals?.length) return 0;
  return referrals.reduce(
    (sum, ref) => sum + (ref.referrer_received_eth_amount || 0),
    0,
  );
};

export const calculateReferralTrend = (referrals: Referral[]) => {
  if (!referrals?.length) return 0;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const currentMonthEarnings = referrals
    .filter((ref) => {
      const refDate = new Date(ref.updated_at || '');
      return (
        refDate.getMonth() === currentMonth &&
        refDate.getFullYear() === currentYear
      );
    })
    .reduce((sum, ref) => sum + (ref.referrer_received_eth_amount || 0), 0);

  const lastMonthEarnings = referrals
    .filter((ref) => {
      const refDate = new Date(ref.updated_at || '');
      return (
        refDate.getMonth() === lastMonth &&
        refDate.getFullYear() === lastMonthYear
      );
    })
    .reduce((sum, ref) => sum + (ref.referrer_received_eth_amount || 0), 0);

  if (lastMonthEarnings === 0) return currentMonthEarnings > 0 ? 100 : 0;

  const percentageChange =
    ((currentMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100;
  return Math.round(percentageChange);
};

export const getInitialTab = () => {
  const params = new URLSearchParams(location.search);
  const tabParam = params.get('tab');

  if (!tabParam) {
    return MobileTabType.Referrals;
  }

  return tabParamToMobileTab[tabParam];
};

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
