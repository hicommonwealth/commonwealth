/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../index';

export interface CreateCommentResponseThreadAddress {
  id?: number;
  address: string;
  communityId: string;
  userId?: number;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  verified?: Date;
  lastActive?: Date;
  ghostAddress?: boolean;
  walletId?: CommonApi.CreateCommentResponseThreadAddressWalletId;
  blockInfo?: string;
  isUserDefault?: boolean;
  role?: CommonApi.CreateCommentResponseThreadAddressRole;
  isBanned?: boolean;
  hex?: string;
  user?: CommonApi.CreateCommentResponseThreadAddressUser;
  createdAt?: Date;
  updatedAt?: Date;
}
