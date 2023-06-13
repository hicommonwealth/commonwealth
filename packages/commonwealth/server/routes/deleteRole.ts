import { AppError } from 'common-common/src/errors';
import Sequelize from 'sequelize';
import type { ValidateChainParams } from '../middleware/validateChain';
import type { DB } from '../models';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import { findOneRole } from '../util/roles';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  InvalidAddress: 'Invalid address',
  RoleDNE: 'Role does not exist',
  OtherAdminDNE: 'Must assign another admin',
};

type DeleteRoleReq = {
  address_id: number;
} & ValidateChainParams;

type DeleteRoleResp = Record<string, never>;

const deleteRole = async (
  models: DB,
  req: TypedRequestBody<DeleteRoleReq>,
  res: TypedResponse<DeleteRoleResp>
) => {
  const chain = req.chain;
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
  await models.Address.update(
    { role: 'member' },
    { where: { id: req.body.address_id } }
  );

  return success(res, {});
};

export default deleteRole;
