import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import proposalIdToEntity from '../util/proposalIdToEntity';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';

export const Errors = {
  NoEntity: 'Cannot find entity',
  NotAdminOrOwner: 'Not an admin or owner of this entity',
};

const updateThreadLinkedChainEntities = async (models, req: Request, res: Response, next: NextFunction) => {
  const [chain, community, error] = await lookupCommunityIsVisibleToUser(models, req.body, req.user);
  if (error) return next(new Error(error));
  const { unique_id, title } = req.body;

  const entity = await proposalIdToEntity(models, chain.id, unique_id);
  if (!entity) return next(new Error(Errors.NoEntity));
  const userOwnedAddressIds = await req.user.getAddresses().filter((addr) => {
    return !!addr.verified;
  }).map((addr) => addr.id);
  // if (!userOwnedAddressIds.includes(entity.address_id)) {
  const roles = await models.Role.findAll({
    where: {
      address_id: { [Op.in]: userOwnedAddressIds, },
      permission: { [Op.in]: ['admin', 'moderator'] },
    }
  });
  const role = roles.find((r) => {
    return r.offchain_community_id === entity.community || r.chain_id === entity.chain;
  });
  if (!role) return next(new Error(Errors.NotAdminOrOwner));
  // }

  entity.title = title;
  entity.save();

  const finalEntity = await models.ChainEntity.findOne({
    where: { id: entity.id },
    include: [ {
      model: models.ChainEvent,
      order: [
        [ models.ChainEvent, 'id', 'asc' ]
      ],
      include: [ models.ChainEventType ],
    } ],
  });

  console.log(finalEntity);

  return res.json({ status: 'Success', result: finalEntity.toJSON() });
};

export default updateThreadLinkedChainEntities;
