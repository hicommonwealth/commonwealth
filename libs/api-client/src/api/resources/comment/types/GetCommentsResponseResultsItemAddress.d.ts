/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../index';

export interface GetCommentsResponseResultsItemAddress {
  id?: number;
  address: string;
  communityId: string;
  userId?: number;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  verified?: Date;
  lastActive?: Date;
  ghostAddress?: boolean;
  walletId?: CommonApi.GetCommentsResponseResultsItemAddressWalletId;
  blockInfo?: string;
  isUserDefault?: boolean;
  role?: CommonApi.GetCommentsResponseResultsItemAddressRole;
  isBanned?: boolean;
  hex?: string;
  user?: CommonApi.GetCommentsResponseResultsItemAddressUser;
  createdAt?: Date;
  updatedAt?: Date;
}
