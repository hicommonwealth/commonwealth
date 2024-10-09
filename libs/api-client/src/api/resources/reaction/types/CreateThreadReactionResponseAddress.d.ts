/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../index';

export interface CreateThreadReactionResponseAddress {
  id?: number;
  address: string;
  communityId: string;
  userId?: number;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  verified?: Date;
  lastActive?: Date;
  ghostAddress?: boolean;
  walletId?: CommonApi.CreateThreadReactionResponseAddressWalletId;
  blockInfo?: string;
  isUserDefault?: boolean;
  role?: CommonApi.CreateThreadReactionResponseAddressRole;
  isBanned?: boolean;
  hex?: string;
  user?: CommonApi.CreateThreadReactionResponseAddressUser;
  createdAt?: Date;
  updatedAt?: Date;
}
