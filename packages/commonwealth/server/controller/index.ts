import { AppError } from '@hicommonwealth/core';
import type { AddressAttributes, DB } from '@hicommonwealth/model';
import type { Role } from '@hicommonwealth/shared';
import { Op } from 'sequelize';
import { TypedRequestQuery, TypedResponse } from 'server/types';

export const Errors = {
  InvalidChain: 'Invalid chain',
  InvalidPermissions: 'Invalid permissions',
};

type ListRolesReq = {
  permissions: string[];
};

type ListRolesResp = AddressAttributes[];

export async function listRoles(
  models: DB,
  req: TypedRequestQuery<ListRolesReq>,
  res: TypedResponse<ListRolesResp>,
) {
  const { permissions } = req.query;
  if (!req.chain) {
    throw new AppError(Errors.InvalidChain);
  }
  if (typeof permissions !== 'undefined' && !Array.isArray(permissions)) {
    throw new AppError(Errors.InvalidPermissions);
  }
  const filteredPermissions: Role[] | undefined =
    permissions?.length > 0 && Array.isArray(permissions)
      ? (permissions
          .map(String)
          .filter((p) =>
            ['member', 'moderator', 'admin'].includes(p as string),
          ) as Role[])
      : undefined;
  if (!filteredPermissions) {
    throw new AppError(Errors.InvalidPermissions);
  }

  const adminsAndMods = await models.Address.findAll({
    where: {
      community_id: req.chain.id,
      role: {
        [Op.in]: filteredPermissions,
      },
    },
  });

  return res.json({ status: 'Success', result: adminsAndMods });
}
