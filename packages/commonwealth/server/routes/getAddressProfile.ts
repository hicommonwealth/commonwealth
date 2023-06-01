import { AppError } from 'common-common/src/errors';
import type { NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import type { DB } from '../models';
import type { TypedRequestBody, TypedResponse } from '../types';
import { failure } from '../types';

export const Errors = {
  InvalidAddress: 'Invalid address',
};

export const getAddressProfileValidation = [
  body('chains').exists().toArray(),
  body('addresses').exists().toArray()
];

export type GetAddressProfileReq = {
  addresses: string[];
  chains: string[];
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

  const addressEntities = await models.Address.findAll({
    where: {
      chain: { [Op.in]: req.body.chains },
      address: { [Op.in]: req.body.addresses },
    },
    include: [models.Profile],
  });

  if (addressEntities.length === 0) {
    return next(new AppError(Errors.InvalidAddress));
  }

  const profiles: GetAddressProfileResp[] = await Promise.all(
    addressEntities.map(async address => {
      const profile = await address.Profile;

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