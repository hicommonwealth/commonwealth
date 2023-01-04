import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { DB } from '../models';
import { AppError, ServerError } from 'common-common/src/errors';
import { findAllRoles } from '../util/roles';

export const Errors = {
  NoEntity: 'Cannot find entity',
  NotAdminOrOwner: 'Not an admin or owner of this entity',
};

const updateChainEntityTitle = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const chain = req.chain;

  const { title, chain_entity_id } = req.body;
  const entity = await models.ChainEntityMeta.findOne({
    where: {
      ce_id: chain_entity_id,
    },
  });
  if (!entity) return next(new AppError(Errors.NoEntity));
  const userOwnedAddressObjects = (await req.user.getAddresses()).filter(
    (addr) => !!addr.verified
  );
  const userOwnedAddresses = userOwnedAddressObjects.map(
    (addr) => addr.address
  );
  const userOwnedAddressIds = userOwnedAddressObjects.map((addr) => addr.id);

  if (!userOwnedAddresses.includes(entity.author)) {
    const roles = await findAllRoles(
      models,
      { where: { address_id: { [Op.in]: userOwnedAddressIds } } },
      chain.id,
      ['admin', 'moderator']
    );
    // If address does not belong to entity chain, return error
    const role = roles.find((r) => {
      return r.chain_id === entity.chain;
    });
    if (!role) return next(new AppError(Errors.NotAdminOrOwner));
  }

  entity.title = title;
  await entity.save();

  return res.json({ status: 'Success', result: entity.toJSON() });
};

export default updateChainEntityTitle;
