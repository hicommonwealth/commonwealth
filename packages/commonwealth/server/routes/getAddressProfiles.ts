import { AppError } from 'common-common/src/errors';
import type { NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import type { DB } from '../models';
import type { TypedRequestBody, TypedResponse } from '../types';
import { failure } from '../types';

export const Errors = {
  NeedAddress: 'Must provide address',
  NeedChain: 'Must provide chain',
  InvalidChain: 'Invalid chain',
  InvalidAddress: 'Invalid address',
};

export const getAddressProfileValidation = [
  body('chain').exists().isString().trim(),
  body('addresses').exists().toArray()
];

export type GetAddressProfileReq = {
  addresses: string[];
  chain: string;
};

type GetAddressProfileResp = {
  profileId: number;
  name: string;
  address: string;
  lastActive: Date;
  avatarUrl: string;
};

const getAddressProfiles = async (
  models: DB,
  req: TypedRequestBody<GetAddressProfileReq>,
  res: TypedResponse<GetAddressProfileResp[]>,
  next: NextFunction
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }

  // make sure it is in an array
  const addresses = Array.isArray(req.body.addresses) ? req.body.addresses : [req.body.addresses];
  const chain = req.body.chain;

  const addressEntities = await models.Address.findAll({
    where: {
      chain,
      address: { [Op.in]: addresses },
    },
    include: [models.Profile],
  });

  if (addressEntities.length === 0) {
    return next(new AppError(Errors.InvalidAddress));
  }

  const profiles: GetAddressProfileResp[] = await Promise.all(
    addressEntities.map(async address => {
      const profile = await address.getProfile();
      return {
        profileId: address.profile_id,
        name: profile?.profile_name,
        address: address.address,
        lastActive: address.last_active,
        avatarUrl: profile?.avatar_url,
      };
    })
  );

  return res.json({
    status: 'Success',
    result: profiles
  });
};

export default getAddressProfiles;
