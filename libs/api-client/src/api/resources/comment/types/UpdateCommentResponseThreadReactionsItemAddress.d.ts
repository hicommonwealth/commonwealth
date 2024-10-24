/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../index';
export interface UpdateCommentResponseThreadReactionsItemAddress {
  id?: number;
  address: string;
  communityId: string;
  userId?: number;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  verified?: Date;
  lastActive?: Date;
  ghostAddress?: boolean;
  walletId?: CommonApi.UpdateCommentResponseThreadReactionsItemAddressWalletId;
  blockInfo?: string;
  isUserDefault?: boolean;
  role?: CommonApi.UpdateCommentResponseThreadReactionsItemAddressRole;
  isBanned?: boolean;
  hex?: string;
  user?: CommonApi.UpdateCommentResponseThreadReactionsItemAddressUser;
  createdAt?: Date;
  updatedAt?: Date;
}
