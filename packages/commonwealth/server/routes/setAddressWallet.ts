import {  DB } from '../database';
import { AppError } from '../util/errors';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { TypedResponse, success, TypedRequestBody } from '../types';
import { WalletId } from 'common-common/src/types';

export const Errors = {
  InvalidUser: 'Invalid user',
  AddressAlreadyHasWalletId: 'Address already has wallet id',
  InvalidWalletId: 'Invalid wallet id',
};

type SetAddressWalletReq = {
  address: string,
  wallet_id: WalletId;
  author_chain: string;
  jwt: string;
};

const setAddressWallet = async (
  models: DB,
  req: TypedRequestBody<SetAddressWalletReq>,
  res: TypedResponse<Record<string, never>>,
) => {
  const [author, authorError] = await lookupAddressIsOwnedByUser(models, req);
  if (!author) throw new AppError(Errors.InvalidUser);
  if (authorError) throw new AppError(authorError);
  if (author.wallet_id) throw new AppError(Errors.AddressAlreadyHasWalletId);
  if (!Object.values(WalletId).includes(req.body.wallet_id)) {
    throw new AppError(Errors.InvalidWalletId);
  }
  author.wallet_id = req.body.wallet_id;
  await author.save();
  return success(res, {});
};

export default setAddressWallet;
