import { Op } from 'sequelize';
import validateChain, { ValidateChainParams } from '../util/validateChain';
import { DB } from '../models';
import { AppError } from '../util/errors';
import { success, TypedRequestBody, TypedResponse } from '../types';
import {
  findOneRole,
  RoleInstanceWithPermission,
} from '../util/roles';
import { Permission } from '../models/role';
import { CommunityRoleAttributes } from '../models/community_role';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  InvalidPermission: 'Invalid Permission Name',
  RoleDNE: 'Role does not exist',
  NotAdmin: 'Can only modify admin roles with admin',
  NoChainFound: 'Chain not found',
  NoChainId: 'Must provide chain ID',
};

type UpdateRoleReq = {
  permission: Permission;
  allow: bigint;
  deny: bigint;
} & ValidateChainParams;

type UpdateRoleResp = CommunityRoleAttributes;

const updateCommunityRole = async (
  models: DB,
  req: TypedRequestBody<UpdateRoleReq>,
  res: TypedResponse<UpdateRoleResp>
) => {
  if (!req.body.chain && !req.body.chain_id)
    throw new AppError(Errors.NoChainId);

  const [chain, error] = await validateChain(models, req.body);
  if (error) throw new AppError(error);
  if (!req.user) throw new AppError(Errors.NotLoggedIn);
  if (!req.body.permission) throw new AppError(Errors.InvalidPermission);

  if (!chain) return new AppError(Errors.NoChainFound);
  if (!req.user.isAdmin) {
    return new AppError(Errors.NotAdmin);
  }

  const existingRole: RoleInstanceWithPermission = await findOneRole(
    models,
    {},
    chain.id,
    [req.body.permission]
  );
  if (!existingRole) throw new AppError(Errors.RoleDNE);

  const role = await models.CommunityRole.findOne({
    where: {
      chain_id: chain.id,
      name: req.body.permission,
    },
  });

  if (!role) {
    throw new Error('Role does not exist');
  }

  role.allow = req.body.allow;
  role.deny = req.body.deny;

  await role.save();

  return success(res, role.toJSON());
};

export default updateCommunityRole;
