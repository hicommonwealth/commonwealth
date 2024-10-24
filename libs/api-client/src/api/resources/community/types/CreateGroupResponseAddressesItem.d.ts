/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../index';
export interface CreateGroupResponseAddressesItem {
  id?: number;
  address: string;
  communityId: string;
  userId?: number;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  verified?: Date;
  lastActive?: Date;
  ghostAddress?: boolean;
  walletId?: CommonApi.CreateGroupResponseAddressesItemWalletId;
  blockInfo?: string;
  isUserDefault?: boolean;
  role?: CommonApi.CreateGroupResponseAddressesItemRole;
  isBanned?: boolean;
  hex?: string;
  user?: CommonApi.CreateGroupResponseAddressesItemUser;
  createdAt?: Date;
  updatedAt?: Date;
}
