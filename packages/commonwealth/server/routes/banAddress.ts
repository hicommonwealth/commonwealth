import { AppError } from '@hicommonwealth/core';
import type { BanAttributes, BanInstance, DB } from '@hicommonwealth/model';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import { validateOwner } from '../util/validateOwner';

enum BanAddressErrors {
  NoAddress = 'Must supply an address',
  NoPermission = 'You do not have permission to ban an address',
  AlreadyExists = 'Ban for this address already exists',
}

type BanAddressReq = Omit<BanInstance, 'id'> & {
  address: string;
};

type BanAddressResp = BanAttributes;

const banAddress = async (
  models: DB,
  req: TypedRequestBody<BanAddressReq>,
  res: TypedResponse<BanAddressResp>,
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
    throw new AppError(BanAddressErrors.NoPermission);
  }
  const { address } = req.body;
  if (!address) {
    throw new AppError(BanAddressErrors.NoAddress);
  }

  // find or create Ban
  const [ban, created] = await models.Ban.findOrCreate({
    where: {
      // @ts-expect-error StrictNullChecks
      community_id: community.id,
      address,
    },
    defaults: {
      // @ts-expect-error StrictNullChecks
      community_id: community.id,
      address,
    },
  });

  if (!created) {
    throw new AppError(BanAddressErrors.AlreadyExists);
  }

  return success(res, ban.toJSON());
};

export default banAddress;
