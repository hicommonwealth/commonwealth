import { ReferralView } from '@hicommonwealth/schemas';
import type { z } from 'zod';

export enum MobileTabType {
  Referrals = 'Referrals',
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

type ReferralViewType = z.infer<typeof ReferralView>;

export interface Referral {
  referee_user_id: ReferralViewType['referee_user_id'];
  referee_address: ReferralViewType['referee_address'];
  referee_profile: ReferralViewType['referee_profile'];
  referrer_received_eth_amount: ReferralViewType['referrer_received_eth_amount'];
  updated_at?: string | Date | undefined;
}
