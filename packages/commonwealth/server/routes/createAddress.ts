import type { AddressAttributes, DB } from '@hicommonwealth/model';
import type { WalletId, WalletSsoSource } from '@hicommonwealth/shared';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import { createAddressHelper } from '../util/createAddressHelper';

export const Errors = {
  NeedAddress: 'Must provide address',
  NeedCommunity: 'Must provide community',
  NeedWallet: 'Must provide valid walletId',
  InvalidCommunity: 'Invalid community',
  InvalidAddress: 'Invalid address',
};

export type CreateAddressReq = {
  address: string;
  community_id?: string;
  wallet_id: WalletId;
  wallet_sso_source: WalletSsoSource;
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
) => {
  // @ts-expect-error StrictNullChecks
  const result = await createAddressHelper(req.body, models, req.user);
  return success(res, result);
};

export default createAddress;
