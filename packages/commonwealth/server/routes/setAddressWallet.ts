import { AppError, WalletId } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

export const Errors = {
  InvalidUser: 'Invalid user',
  AddressAlreadyHasWalletId: 'Address already has wallet id',
  InvalidWalletId: 'Invalid wallet id',
};

type SetAddressWalletReq = {
  address: string;
  wallet_id: WalletId;
  author_community: string;
  jwt: string;
};

const setAddressWallet = async (
  models: DB,
  req: TypedRequestBody<SetAddressWalletReq>,
  res: TypedResponse<Record<string, never>>,
) => {
  const author = req.address;
  if (author.wallet_id) throw new AppError(Errors.AddressAlreadyHasWalletId);
  if (!Object.values(WalletId).includes(req.body.wallet_id)) {
    throw new AppError(Errors.InvalidWalletId);
  }
  author.wallet_id = req.body.wallet_id;
  await author.save();
  return success(res, {});
};

export default setAddressWallet;
