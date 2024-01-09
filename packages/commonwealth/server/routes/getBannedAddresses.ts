import { AppError } from '@hicommonwealth/adapters';
import type { DB } from '../models';
import type { BanAttributes } from '../models/ban';
import type { TypedRequestQuery, TypedResponse } from '../types';
import { success } from '../types';
import { validateOwner } from '../util/validateOwner';

enum GetBannedAddressesErrors {
  NoChain = 'Must supply a chain ID',
  NoPermission = 'You do not have permission to ban an address',
}

type GetBannedAddressesReq = {
  chain_id: string;
};

type GetBannedAddressesResp = BanAttributes[];

const getBannedAddresses = async (
  models: DB,
  req: TypedRequestQuery<GetBannedAddressesReq>,
  res: TypedResponse<GetBannedAddressesResp>,
) => {
  const chain = req.chain;

  const isAdmin = await validateOwner({
    models: models,
    user: req.user,
    communityId: chain.id,
    allowAdmin: true,
    allowGodMode: true,
  });
  if (!isAdmin) {
    throw new AppError(GetBannedAddressesErrors.NoPermission);
  }

  const bans = await models.Ban.findAll({ where: { community_id: chain.id } });
  return success(
    res,
    bans.map((b) => b.toJSON()),
  );
};

export default getBannedAddresses;
