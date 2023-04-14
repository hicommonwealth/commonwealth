import type { DB } from '../models';
import { AppError } from 'common-common/src/errors';
import type { BanAttributes, BanInstance } from '../models/ban';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import validateRoles from '../util/validateRoles';

enum BanAddressErrors {
  NoChain = 'Must supply a chain ID',
  NoAddress = 'Must supply an address',
  NoPermission = 'You do not have permission to ban an address',
}

type BanAddressReq = Omit<BanInstance, 'id'> & {
  chain_id: string;
  address: string;
};

type BanAddressResp = BanAttributes;

const banAddress = async (
  models: DB,
  req: TypedRequestBody<BanAddressReq>,
  res: TypedResponse<BanAddressResp>
) => {
  const chain = req.chain;
  const isAdmin = await validateRoles(models, req.user, 'admin', chain.id);
  if (!isAdmin) throw new AppError(BanAddressErrors.NoPermission);

  const { address } = req.body;
  if (!address) throw new AppError(BanAddressErrors.NoAddress);

  // find or create Ban
  const [ban] = await models.Ban.findOrCreate({
    where: {
      chain_id: chain.id,
      address,
    },
    defaults: {
      chain_id: chain.id,
      address,
    },
  });

  return success(res, ban.toJSON());
};

export default banAddress;
