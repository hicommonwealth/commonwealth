import type { DB } from '@hicommonwealth/model';
import { body, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import type { TypedRequestBody, TypedResponse } from '../types';
import { failure } from '../types';

export const getAddressProfileValidation = [
  body('communities').exists().toArray(),
  body('addresses').exists().toArray(),
];

export type GetAddressProfileReq = {
  addresses: string[];
  communities: string[];
};

type GetAddressProfileResp = {
  profileId: number;
  name: string;
  address: string;
  lastActive: Date;
  avatarUrl?: string | null;
};

const getAddressProfiles = async (
  models: DB,
  req: TypedRequestBody<GetAddressProfileReq>,
  res: TypedResponse<GetAddressProfileResp[]>,
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }

  const userWhere = req.body.addresses
    ? {
        address: { [Op.in]: req.body.addresses },
      }
    : req.user
    ? { user_id: req.user.id }
    : {};

  // TODO: Can we  use some caching in the client to avoid calling this
  // api so many times?
  const addressEntities = await models.Address.findAll({
    where: {
      community_id: { [Op.in]: req.body.communities },
      ...userWhere,
    },
    attributes: ['profile_id', 'address', 'last_active'],
    include: [
      {
        model: models.User,
        attributes: ['profile', 'created_at'],
        required: true,
      },
    ],
  });

  const profiles = addressEntities.map((address) => {
    return {
      profileId: address.profile_id!, // TO BE REMOVED
      name: address.User?.profile.name ?? 'Anonymous',
      address: address.address,
      lastActive: address.last_active ?? address.User?.created_at,
      avatarUrl: address.User?.profile.avatar_url,
    };
  });

  return res.json({
    status: 'Success',
    result: profiles,
  });
};

export default getAddressProfiles;
