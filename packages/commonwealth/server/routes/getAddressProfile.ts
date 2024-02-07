import type { DB } from '@hicommonwealth/model';
import { body, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import type { TypedRequestBody, TypedResponse } from '../types';
import { failure } from '../types';

export const getAddressProfileValidation = [
  body('chains').exists().toArray(),
  body('addresses').exists().toArray(),
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
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }

  const addressEntities = await models.Address.findAll({
    where: {
      community_id: { [Op.in]: req.body.chains },
      address: { [Op.in]: req.body.addresses },
    },
    include: [
      {
        model: models.Profile,
        required: true,
      },
    ],
  });

  const profiles = addressEntities.map((address) => {
    return {
      profileId: address.profile_id,
      name: address.Profile.profile_name,
      address: address.address,
      lastActive: address.last_active,
      avatarUrl: address.Profile.avatar_url,
    };
  });

  return res.json({
    status: 'Success',
    result: profiles,
  });
};

export default getAddressProfiles;
