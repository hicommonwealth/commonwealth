/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../index';

export interface CreateCommentReactionResponseAddress {
  id?: number;
  address: string;
  communityId: string;
  userId?: number;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  verified?: Date;
  lastActive?: Date;
  ghostAddress?: boolean;
  walletId?: CommonApi.CreateCommentReactionResponseAddressWalletId;
  blockInfo?: string;
  isUserDefault?: boolean;
  role?: CommonApi.CreateCommentReactionResponseAddressRole;
  isBanned?: boolean;
  hex?: string;
  user?: CommonApi.CreateCommentReactionResponseAddressUser;
  createdAt?: Date;
  updatedAt?: Date;
}
