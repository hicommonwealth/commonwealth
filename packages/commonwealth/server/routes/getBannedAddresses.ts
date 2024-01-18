import { AppError } from '@hicommonwealth/adapters';
import type { DB } from '../models';
import type { BanAttributes } from '../models/ban';
import type { TypedRequest, TypedResponse } from '../types';
import { success } from '../types';
import { validateOwner } from '../util/validateOwner';

enum GetBannedAddressesErrors {
  NoPermission = 'You do not have permission to get banned addresses',
}

type GetBannedAddressesResp = BanAttributes[];

const getBannedAddresses = async (
  models: DB,
  req: TypedRequest,
  res: TypedResponse<GetBannedAddressesResp>,
) => {
  const { community } = req;

  const isAdmin = await validateOwner({
    models: models,
    user: req.user,
    communityId: community.id,
    allowAdmin: true,
    allowGodMode: true,
  });
  if (!isAdmin) {
    throw new AppError(GetBannedAddressesErrors.NoPermission);
  }

  const bans = await models.Ban.findAll({
    where: { community_id: community.id },
  });
  return success(
    res,
    bans.map((b) => b.toJSON()),
  );
};

export default getBannedAddresses;
