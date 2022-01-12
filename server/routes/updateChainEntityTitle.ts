import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import proposalIdToEntity from '../util/proposalIdToEntity';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { DB } from '../database';

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
  const [chain, error] = await lookupCommunityIsVisibleToUser(
    models,
    req.body,
    req.user
  );
  if (error) return next(new Error(error));
  const { unique_id, title } = req.body;

  const entity = await proposalIdToEntity(models, chain.id, unique_id);
  if (!entity) return next(new Error(Errors.NoEntity));
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
    if (!role) return next(new Error(Errors.NotAdminOrOwner));
  }

  entity.title = title;
  await entity.save();

  const finalEntity = await models.ChainEntity.findOne({
    where: { id: entity.id },
    include: [
      {
        model: models.ChainEvent,
        order: [[models.ChainEvent, 'id', 'asc']],
        include: [models.ChainEventType],
      },
    ],
  });

  return res.json({ status: 'Success', result: finalEntity.toJSON() });
};

export default updateChainEntityTitle;
