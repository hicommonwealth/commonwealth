import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import type { Role } from '@hicommonwealth/shared';
import type { Request, Response } from 'express';
import { findAllRoles } from '../util/roles';

export const Errors = {
  InvalidChain: 'Invalid chain',
  InvalidPermissions: 'Invalid permissions',
};

export async function listRoles(models: DB, req: Request, res: Response) {
  const { permissions } = req.query;
  if (!req.chain) {
    throw new AppError(Errors.InvalidChain);
  }
  if (typeof permissions !== 'undefined' && !Array.isArray(permissions)) {
    throw new AppError(Errors.InvalidPermissions);
  }
  const filteredPermissions: Role[] =
    permissions?.length > 0 && Array.isArray(permissions)
      ? (permissions
          .map(String)
          .filter((p) =>
            ['member', 'moderator', 'admin'].includes(p as string),
          ) as Role[])
      : undefined;

  const roles = await findAllRoles(
    models,
    {
      include: [models.Address],
    },
    req.chain.id,
    filteredPermissions,
  );

  return res.json({ status: 'Success', result: roles });
}
