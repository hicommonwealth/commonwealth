import Sequelize from 'sequelize';
import validateChain, { ValidateChainParams } from '../util/validateChain';
import { DB } from '../models';
import { AppError } from 'common-common/src/errors';
import { success, TypedRequestBody, TypedResponse } from '../types';
import { findOneRole } from '../util/roles';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  InvalidAddress: 'Invalid address',
  RoleDNE: 'Role does not exist',
  OtherAdminDNE: 'Must assign another admin',
};

type DeleteRoleReq = {
  address_id: number,
} & ValidateChainParams;

type DeleteRoleResp = Record<string, never>;

const deleteRole = async (
  models: DB,
  req: TypedRequestBody<DeleteRoleReq>,
  res: TypedResponse<DeleteRoleResp>
) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) throw new AppError(error);
  if (!req.user) throw new AppError(Errors.NotLoggedIn);
  if (!req.body.address_id) throw new AppError(Errors.InvalidAddress);

  const validAddress = await models.Address.findOne({
    where: {
      id: req.body.address_id,
      user_id: req.user.id,
      verified: { [Sequelize.Op.ne]: null },
    },
  });
  if (!validAddress) throw new AppError(Errors.InvalidAddress);
  const existingRole = await findOneRole(
    models,
    { where: { address_id: req.body.address_id } },
    chain.id
  );
  if (!existingRole) throw new AppError(Errors.RoleDNE);

  if (existingRole.permission === 'admin') {
    const otherExistingAdmin = await findOneRole(
      models,
      {
        where: {
          address_id: req.body.address_id,
          id: { [Sequelize.Op.ne]: existingRole.toJSON().id },
        },
      },
      chain.id,
      ['admin']
    );
    if (!otherExistingAdmin) throw new AppError(Errors.OtherAdminDNE);
  }

  // Destroy all role assignments associated with the existing role and chain id and address provided
  await models.RoleAssignment.destroy({
    where: {
      community_role_id: existingRole.toJSON().community_role_id,
      address_id: req.body.address_id
    }
  });

  return success(res, {});
};

export default deleteRole;
