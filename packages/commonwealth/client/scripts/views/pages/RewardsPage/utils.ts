import moment from 'moment';
import { fromWei } from 'web3-utils';
import { MobileTabType, ReferralFee, TabParam, TableType } from './types';

export const calculateTotalEarnings = (referralFees: ReferralFee[]) => {
  if (!referralFees?.length) return 0;

  const totalWei = referralFees.reduce(
    (sum, fee) => sum + BigInt(fee.referrer_received_amount),
    0n,
  );

  return Number(fromWei(totalWei.toString(), 'ether'));
};

const getMonthEarnings = (
  referralFees: ReferralFee[],
  targetDate: moment.Moment,
) => {
  return referralFees
    .filter((fee) => {
      const feeDate = moment.unix(Number(fee.transaction_timestamp));
      return (
        feeDate.month() === targetDate.month() &&
        feeDate.year() === targetDate.year()
      );
    })
    .reduce((sum, fee) => sum + BigInt(fee.referrer_received_amount), 0n);
};

export const calculateReferralTrend = (referralFees: ReferralFee[]) => {
  if (!referralFees?.length) return 0;

  const now = moment();
  const lastMonth = moment(now).subtract(1, 'month');

  const currentMonthEarnings = getMonthEarnings(referralFees, now);
  const lastMonthEarnings = getMonthEarnings(referralFees, lastMonth);

  if (lastMonthEarnings === 0n) return currentMonthEarnings > 0 ? 100 : 0;

  const percentageChange = Number(
    ((currentMonthEarnings - lastMonthEarnings) * 100n) / lastMonthEarnings,
  );

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
