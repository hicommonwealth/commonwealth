import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import { validateOwner } from '../util/validateOwner';

enum BanAddressErrors {
  NoAddress = 'Must supply an address',
  NoPermission = 'You do not have permission to ban an address',
  AlreadyExists = 'Ban for this address already exists',
  NotFound = 'Address not found',
}

type BanAddressReq = {
  community_id: string;
  address: string;
};

type BanAddressResp = {};

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

  const addressInstance = await models.Address.findOne({
    where: {
      community_id: community!.id,
      address,
    },
  });
  if (!addressInstance) {
    throw new AppError(BanAddressErrors.NotFound);
  }
  if (addressInstance.is_banned) {
    throw new AppError(BanAddressErrors.AlreadyExists);
  }
  addressInstance.is_banned = true;
  await addressInstance.save();

  return success(res, {});
};

export default banAddress;
