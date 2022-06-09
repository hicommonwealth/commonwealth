import { Response, NextFunction } from 'express';
import { AppError } from '../util/errors';
import { success, TypedRequestBody } from '../types';
import { DB } from '../database';
import validateChain from '../util/validateChain';
import validateRoles from '../util/validateRoles';
import { BanInstance } from '../models/ban';

enum BanAddressErrors {
  NoChain = 'Must supply a chain ID',
  NoAddress = 'Must supply an address',
  NoPermission = 'You do not have permission to ban an address',
}


type BanAddressReq = Omit<BanInstance, 'id'> & {
  chain_id: string;
  address: string;
};

const banAddress = async (
  models: DB,
  req: TypedRequestBody<BanAddressReq>,
  res: Response,
) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) throw new AppError(BanAddressErrors.NoChain);
  const isAdmin = validateRoles(models, req.user, 'admin', chain.id);
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
    }
  });

  return success(res, ban.toJSON());
};

export default banAddress;
