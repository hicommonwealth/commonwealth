/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../index';

export interface GetCommunitiesResponseResultsItemAddressesItem {
  id?: number;
  address: string;
  communityId: string;
  userId?: number;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  verified?: Date;
  lastActive?: Date;
  ghostAddress?: boolean;
  walletId?: CommonApi.GetCommunitiesResponseResultsItemAddressesItemWalletId;
  blockInfo?: string;
  isUserDefault?: boolean;
  role?: CommonApi.GetCommunitiesResponseResultsItemAddressesItemRole;
  isBanned?: boolean;
  hex?: string;
  user?: CommonApi.GetCommunitiesResponseResultsItemAddressesItemUser;
  createdAt?: Date;
  updatedAt?: Date;
}
