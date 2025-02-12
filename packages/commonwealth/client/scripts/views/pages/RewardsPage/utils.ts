import moment from 'moment';
import { MobileTabType, Referral, TabParam, TableType } from './types';

export const calculateTotalEarnings = (referrals: Referral[]) => {
  if (!referrals?.length) return 0;
  return referrals.reduce(
    (sum, ref) => sum + (Number(ref.referrer_received_eth_amount) || 0),
    0,
  );
};

const getMonthEarnings = (referrals: Referral[], targetDate: moment.Moment) => {
  return referrals
    .filter((ref) => {
      const refDate = moment(ref.updated_at);
      return (
        refDate.month() === targetDate.month() &&
        refDate.year() === targetDate.year()
      );
    })
    .reduce(
      (sum, ref) => sum + (Number(ref.referrer_received_eth_amount) || 0),
      0,
    );
};

export const calculateReferralTrend = (referrals: Referral[]) => {
  if (!referrals?.length) return 0;

  const now = moment();
  const lastMonth = moment(now).subtract(1, 'month');

  const currentMonthEarnings = getMonthEarnings(referrals, now);
  const lastMonthEarnings = getMonthEarnings(referrals, lastMonth);

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
