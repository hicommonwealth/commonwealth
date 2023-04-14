import type { DB } from '../models';
import { AppError } from 'common-common/src/errors';
import { NotificationCategories } from 'common-common/src/types';
import Sequelize from 'sequelize';
import type { ValidateChainParams } from '../middleware/validateChain';
import type { RoleAttributes } from '../models/role';
import type { SubscriptionAttributes } from '../models/subscription';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import { createRole as _createRole } from '../util/roles';

export const Errors = {
  InvalidChainComm: 'Invalid chain or community',
  NotLoggedIn: 'Not logged in',
  InvalidAddress: 'Invalid address',
  RoleAlreadyExists: 'Role already exists',
};

type CreateRoleReq = {
  address_id: number;
} & ValidateChainParams;

type CreateRoleResp = {
  role: RoleAttributes;
  subscription: SubscriptionAttributes;
};

const createRole = async (
  models: DB,
  req: TypedRequestBody<CreateRoleReq>,
  res: TypedResponse<CreateRoleResp>
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
  if (!validAddress?.id) throw new AppError(Errors.InvalidAddress);

  const role = await _createRole(models, validAddress.id, chain.id);

  const [subscription] = await models.Subscription.findOrCreate({
    where: {
      subscriber_id: req.user.id,
      category_id: NotificationCategories.NewThread,
      chain_id: chain.id,
      object_id: chain.id,
      is_active: true,
    },
  });

  return success(res, {
    role: role.toJSON(),
    subscription: subscription.toJSON(),
  });
};

export default createRole;
