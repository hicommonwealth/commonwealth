import { AppError } from '@hicommonwealth/adapters';
import type { Request, Response } from 'express';
import type { DB } from '../models';
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
  const filteredPermissions =
    permissions?.length > 0
      ? permissions.filter((p) => ['member', 'moderator', 'admin'].includes(p))
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
