import { AppError } from 'common-common/src/errors';
import type { NextFunction } from 'express';
import type { TypedRequestBody, TypedResponse } from '../types';
import type { DB } from '../models';

export const Errors = {
  NeedAddress: 'Must provide address',
  NeedChain: 'Must provide chain',
  InvalidChain: 'Invalid chain',
  InvalidAddress: 'Invalid address',
};

type GetAddressProfileReq = {
  address: string;
  chain: string;
};

type GetAddressProfileResp = {
  profileId: number;
  name: string;
  address: string;
  lastActive: Date;
  avatarUrl: string;
};

const getAddressProfile = async (
  models: DB,
  req: TypedRequestBody<GetAddressProfileReq>,
  res: TypedResponse<GetAddressProfileResp>,
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
      name: profile?.profile_name,
      address: address.address,
      lastActive: address.last_active,
      avatarUrl: profile?.avatar_url,
    },
  });
};

export default getAddressProfile;
