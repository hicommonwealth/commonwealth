import { AppError } from 'common-common/src/errors';
import Sequelize from 'sequelize';
import type { DB } from '../models';
import { createRole, findOneRole } from '../util/roles';
import { factory, formatFilename } from 'common-common/src/logging';
import { success } from '../types';
import type { TypedRequestBody, TypedResponse } from '../types';
import type { RoleInstanceWithPermissionAttributes } from '../util/roles';

const log = factory.getLogger(formatFilename(__filename));

const { Op } = Sequelize;

export const Errors = {
  NeedAddress: 'Must provide address',
  NeedChain: 'Must provide chain',
  NeedLoggedIn: 'Must be logged in',
  RoleAlreadyExists: 'Role already exists',
  NotVerifiedAddressOrUser: 'Not verified address or user',
  InvalidChain: 'Invalid chain',
};

type linkExistingAddressToChainReq = {
  address: string; // address they already own
  chain: string;   // chain they are joining
}

type linkExistingAddressToChainResp = RoleInstanceWithPermissionAttributes;

const linkExistingAddressToChain = async (
  models: DB,
  req: TypedRequestBody<linkExistingAddressToChainReq>,
  res: TypedResponse<linkExistingAddressToChainResp>
) => {
  if (!req.body.address) {
    throw new AppError(Errors.NeedAddress);
  }
  if (!req.body.chain) {
    throw new AppError(Errors.NeedChain);
  }
  if (!req.user?.id) {
    throw new AppError(Errors.NeedLoggedIn);
  }
  const userId = req.user.id;

  const chain = await models.Chain.findOne({
    where: { id: req.body.chain },
  });

  if (!chain) {
    throw new AppError(Errors.InvalidChain);
  }

  const addressInstance = await models.Address.scope('withPrivateData').findOne(
    {
      where: {
        address: req.body.address,
        user_id: userId,
        verified: { [Op.ne]: null },
      },
    }
  );

  if (!addressInstance) {
    throw new AppError(Errors.NotVerifiedAddressOrUser);
  }

  const role = await findOneRole(
    models,
    { where: { address_id: addressInstance.id } },
    req.body.chain
  );

  if (role) {
    throw new AppError(Errors.RoleAlreadyExists);
  }

  const newRole = await createRole(models, addressInstance.id, req.body.chain, 'member');
  return success(res, newRole.toJSON());
};

export default linkExistingAddressToChain;
