import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import validateChain from '../util/validateChain';
import { DB } from '../database';
import { AppError, ServerError } from '../util/errors';

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
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new AppError(error));

  const { title, chain_entity_id } = req.body;
  const entity = await models.ChainEntityMeta.findOne({
    where: {
      ce_id: chain_entity_id
    }
  })
  if (!entity) return next(new AppError(Errors.NoEntity));
  const userOwnedAddressObjects = (await req.user.getAddresses()).filter(
    (addr) => !!addr.verified
  );
  const userOwnedAddresses = userOwnedAddressObjects.map(
    (addr) => addr.address
  );
  const userOwnedAddressIds = userOwnedAddressObjects.map((addr) => addr.id);

  if (!userOwnedAddresses.includes(entity.author)) {
    const roles = await models.Role.findAll({
      where: {
        address_id: { [Op.in]: userOwnedAddressIds },
        permission: { [Op.in]: ['admin', 'moderator'] },
      },
    });
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
