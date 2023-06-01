import { QueryTypes } from 'sequelize';
import type { Request, Response } from 'express';
import type { DB } from '../models';
import { Action } from '../../shared/permissions';
import { findAllRoles, isAddressPermitted } from '../util/roles';
import { AppError } from '../../../common-common/src/errors';

export const Errors = {
  InvalidChain: 'Invalid chain',
  InvalidPermissions: 'Invalid permissions',
};

export async function listRoles(models: DB, req: Request, res: Response) {
  if (!req.chain) {
    throw new AppError(Errors.InvalidChain);
  }
  if (!Array.isArray(req.query.permissions)) {
    throw new AppError(Errors.InvalidPermissions);
  }
  const permissions = req.query.permissions.filter((p) =>
    ['member', 'moderator', 'admin'].includes(p)
  );

  const roles = await findAllRoles(
    models,
    {
      include: [models.Address],
    },
    req.chain.id,
    permissions
  );

  return res.json({ status: 'Success', result: roles });
}
