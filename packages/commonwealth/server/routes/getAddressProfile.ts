import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../models';

export const Errors = {
  NeedAddress: 'Must provide address',
  NeedChain: 'Must provide chain',
  InvalidChain: 'Invalid chain',
  InvalidAddress: 'Invalid address',
};

const getAddressProfile = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body.address) {
    return next(new AppError(Errors.NeedAddress));
  }
  if (!req.body.chain) {
    return next(new AppError(Errors.NeedChain));
  }

  const chain = await models.Chain.findOne({
    where: { id: req.body.chain },
  });
  if (!chain) {
    return next(new AppError(Errors.InvalidChain));
  }

  const address = await models.Address.findOne({
    where: {
      chain: req.body.chain,
      address: req.body.address,
    },
    include: [models.Profile],
  });

  if (!address) {
    return next(new AppError(Errors.InvalidAddress));
  }

  const profile = await address.getProfile();

  return res.json({
    status: 'Success',
    result: {
      profileId: address.profile_id,
      name: address.name,
      address: address.address,
      avatarUrl: profile?.avatar_url,
    },
  });
};

export default getAddressProfile;
