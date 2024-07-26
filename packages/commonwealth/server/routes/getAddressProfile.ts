import type { DB } from '@hicommonwealth/model';
import {
  GetAddressProfileReq,
  GetAddressProfileResp,
} from '@hicommonwealth/schemas';
import { body, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { z } from 'zod';
import type { TypedRequestBody, TypedResponse } from '../types';
import { failure } from '../types';

export const getAddressProfileValidation = [
  body('communities').exists().toArray(),
  body('addresses').exists().toArray(),
];

const getAddressProfiles = async (
  models: DB,
  req: TypedRequestBody<z.infer<typeof GetAddressProfileReq>>,
  res: TypedResponse<z.infer<typeof GetAddressProfileResp>[]>,
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
    attributes: ['address', 'last_active'],
    include: [
      {
        model: models.User,
        attributes: ['id', 'profile', 'created_at'],
        required: true,
      },
    ],
  });

  const profiles: z.infer<typeof GetAddressProfileResp>[] = addressEntities.map(
    (address) => {
      return {
        userId: address.User!.id!,
        name: address.User?.profile.name ?? 'Anonymous',
        address: address.address,
        lastActive: address.last_active ?? address.User?.created_at,
        avatarUrl: address.User?.profile.avatar_url ?? undefined,
      };
    },
  );

  return res.json({
    status: 'Success',
    result: profiles,
  });
};

export default getAddressProfiles;
