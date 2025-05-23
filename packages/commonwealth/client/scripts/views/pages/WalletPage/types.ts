import {
  Referral,
  ReferralFeesView,
  ReferralView,
} from '@hicommonwealth/schemas';
import type { z } from 'zod';

export enum MobileTabType {
  WalletBalance = 'Wallet Balance',
  Referrals = 'Referrals',
  Quests = 'Quests',
}

export enum TableType {
  TokenTXHistory = 'Token TX History',
  Referrals = 'Referrals',
  XPEarnings = 'Your Aura',
}

export const enum TabParam {
  referrals = 'referrals',
  wallet = 'wallet',
  quests = 'quests',
}

type ReferralViewType = z.infer<typeof ReferralView>;
type ReferralFeesViewType = z.infer<typeof ReferralFeesView>;

export interface Referral {
  referee_user_id: ReferralViewType['referee_user_id'];
  referee_address: ReferralViewType['referee_address'];
  referee_profile: ReferralViewType['referee_profile'];
  referrer_received_eth_amount: ReferralViewType['referrer_received_eth_amount'];
  community_id?: ReferralViewType['community_id'];
  community_name?: ReferralViewType['community_name'];
  community_icon_url?: ReferralViewType['community_icon_url'];
  namespace_address?: z.infer<typeof Referral>['namespace_address'];
}

export interface ReferralFee {
  referrer_received_amount: ReferralFeesViewType['referrer_received_amount'];
  transaction_timestamp: ReferralFeesViewType['transaction_timestamp'];
}

export const typeToIcon = {
  [MobileTabType.Referrals]: 'userSwitch',
  [MobileTabType.WalletBalance]: 'cardholder',
  [MobileTabType.Quests]: 'trophy',
};
