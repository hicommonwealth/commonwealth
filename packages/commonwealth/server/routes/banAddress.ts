import { AppError } from 'common-common/src/errors';
import type { DB } from '../models';
import type { BanAttributes, BanInstance } from '../models/ban';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import { validateOwner } from '../util/validateOwner';

enum BanAddressErrors {
  NoChain = 'Must supply a chain ID',
  NoAddress = 'Must supply an address',
  NoPermission = 'You do not have permission to ban an address',
  AlreadyExists = 'Ban for this address already exists',
}

type BanAddressReq = Omit<BanInstance, 'id'> & {
  chain_id: string;
  address: string;
};

type BanAddressResp = BanAttributes;

const banAddress = async (
  models: DB,
  req: TypedRequestBody<BanAddressReq>,
  res: TypedResponse<BanAddressResp>,
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
    throw new AppError(BanAddressErrors.NoPermission);
  }
  const { address } = req.body;
  if (!address) {
    throw new AppError(BanAddressErrors.NoAddress);
  }

  // find or create Ban
  const [ban, created] = await models.Ban.findOrCreate({
    where: {
      chain_id: chain.id,
      address,
    },
    defaults: {
      chain_id: chain.id,
      address,
    },
  });

  if (!created) {
    throw new AppError(BanAddressErrors.AlreadyExists);
  }

  return success(res, ban.toJSON());
};

export default banAddress;
