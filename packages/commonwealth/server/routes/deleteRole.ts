import Sequelize from 'sequelize';
import validateChain, { ValidateChainParams } from '../util/validateChain';
import { DB } from '../models';
<<<<<<< HEAD
import { AppError, ServerError } from '../util/errors';
=======
import { AppError } from '../util/errors';
import { success, TypedRequestBody, TypedResponse } from '../types';
>>>>>>> static-ui-generate-from-abi
import { findOneRole } from '../util/roles';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  InvalidAddress: 'Invalid address',
  RoleDNE: 'Role does not exist',
  OtherAdminDNE: 'Must assign another admin',
};

<<<<<<< HEAD
const deleteRole = async (
  models: DB,
  req,
  res: Response,
  next: NextFunction
=======
type DeleteRoleReq = {
  address_id: number,
} & ValidateChainParams;

type DeleteRoleResp = Record<string, never>;

const deleteRole = async (
  models: DB,
  req: TypedRequestBody<DeleteRoleReq>,
  res: TypedResponse<DeleteRoleResp>
>>>>>>> static-ui-generate-from-abi
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
<<<<<<< HEAD
  if (!validAddress) return next(new AppError(Errors.InvalidAddress));
=======
  if (!validAddress) throw new AppError(Errors.InvalidAddress);
>>>>>>> static-ui-generate-from-abi
  const existingRole = await findOneRole(
    models,
    { where: { address_id: req.body.address_id } },
    chain.id
  );
<<<<<<< HEAD
  if (!existingRole) return next(new AppError(Errors.RoleDNE));
=======
  if (!existingRole) throw new AppError(Errors.RoleDNE);
>>>>>>> static-ui-generate-from-abi

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
<<<<<<< HEAD
    if (!otherExistingAdmin) return next(new AppError(Errors.OtherAdminDNE));
=======
    if (!otherExistingAdmin) throw new AppError(Errors.OtherAdminDNE);
>>>>>>> static-ui-generate-from-abi
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
