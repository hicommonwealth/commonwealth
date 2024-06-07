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
      community_id: { [Op.in]: req.body.communities },
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
      // @ts-expect-error StrictNullChecks
      name: address.Profile.profile_name,
      address: address.address,
      lastActive: address.last_active,
      // @ts-expect-error StrictNullChecks
      avatarUrl: address.Profile.avatar_url,
    };
  });

  return res.json({
    status: 'Success',
    // @ts-expect-error StrictNullChecks
    result: profiles,
  });
};

export default getAddressProfiles;
