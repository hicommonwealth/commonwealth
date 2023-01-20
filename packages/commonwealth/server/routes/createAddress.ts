import { NextFunction } from 'express';
import { WalletId } from 'common-common/src/types';
import { DB } from '../models';
import { TypedRequestBody, TypedResponse, success } from '../types';
import { AddressAttributes } from '../models/address';
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
  community?: string;
  keytype?: string;
  block_info?: string;
};

type CreateAddressResp = AddressAttributes & { newly_created: boolean };

const createAddress = async (
  models: DB,
  req: TypedRequestBody<CreateAddressReq>,
  res: TypedResponse<CreateAddressResp>,
  next: NextFunction
) => {
  const output = await createAddressHelper(req.body, models, req.user, next);
  return success(res, output);
};

export default createAddress;
