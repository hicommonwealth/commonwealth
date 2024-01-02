import type { WalletId, WalletSsoSource } from '@hicommonwealth/core';
import type { NextFunction } from 'express';
import type { DB } from '../models';
import type { AddressAttributes } from '../models/address';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import { createAddressHelper } from '../util/createAddressHelper';

export const Errors = {
  NeedAddress: 'Must provide address',
  NeedChain: 'Must provide chain',
  NeedWallet: 'Must provide valid walletId',
  InvalidChain: 'Invalid chain',
  InvalidAddress: 'Invalid address',
};

export type CreateAddressReq = {
  address: string;
  chain: string;
  wallet_id: WalletId;
  wallet_sso_source: WalletSsoSource;
  community?: string;
  keytype?: string;
  block_info?: string;
};

type CreateAddressResp = AddressAttributes & {
  newly_created: boolean;
  joined_community: boolean;
};

const createAddress = async (
  models: DB,
  req: TypedRequestBody<CreateAddressReq>,
  res: TypedResponse<CreateAddressResp>,
  next: NextFunction,
) => {
  const output = await createAddressHelper(req.body, models, req.user, next);
  return success(res, output);
};

export default createAddress;
