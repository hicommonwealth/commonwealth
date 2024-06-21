import { AppError } from '@hicommonwealth/core';
import type { BanAttributes, DB } from '@hicommonwealth/model';
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
    // @ts-expect-error StrictNullChecks
    user: req.user,
    // @ts-expect-error StrictNullChecks
    communityId: community.id,
    allowAdmin: true,
    allowSuperAdmin: true,
  });
  if (!isAdmin) {
    throw new AppError(GetBannedAddressesErrors.NoPermission);
  }

  const bans = await models.Ban.findAll({
    // @ts-expect-error StrictNullChecks
    where: { community_id: community.id },
  });
  return success(
    res,
    bans.map((b) => b.toJSON()),
  );
};

export default getBannedAddresses;
