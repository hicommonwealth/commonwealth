import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import validateChain from '../util/validateChain';
import { DB } from '../database';

export const Errors = {
  NoThread: 'Cannot find thread',
  NotAdminOrOwner: 'Not an admin or owner of this thread',
  ChainEntityAlreadyHasThread: 'Proposal linked to another thread',
};

const updateThreadLinkedChainEntities = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new Error(error));
  const { thread_id } = req.body;

  const thread = await models.OffchainThread.findOne({
    where: {
      id: thread_id,
    },
  });
  if (!thread) return next(new Error(Errors.NoThread));
  const userOwnedAddressIds = (await req.user.getAddresses())
    .filter((addr) => !!addr.verified).map((addr) => addr.id);
  if (!userOwnedAddressIds.includes(thread.address_id)) { // is not author
    const roles = await models.Role.findAll({
      where: {
        address_id: { [Op.in]: userOwnedAddressIds, },
        permission: { [Op.in]: ['admin', 'moderator'] },
      }
    });
    const role = roles.find((r) => {
      return r.chain_id === thread.chain;
    });
    if (!role) return next(new Error(Errors.NotAdminOrOwner));
  }

  const chain_entity_ids = typeof req.body['chain_entity_id[]'] === 'string' ? [req.body['chain_entity_id[]']]
    : req.body['chain_entity_id[]'] ? req.body['chain_entity_id[]'].map((id) => +id) : [];

  // remove any chain entities no longer linked to this thread
  const existingChainEntities = await models.ChainEntity.findAll({
    where: { thread_id }
  });
  const entitiesToClear = existingChainEntities.filter((ce) => chain_entity_ids.indexOf(ce.id) === -1);
  for (let i = 0; i < entitiesToClear.length; i++) {
    entitiesToClear[i].thread_id = null;
    await entitiesToClear[i].save();
  }

  // add any chain entities newly linked to this thread
  const existingEntityIds = existingChainEntities.map((ce) => ce.id);
  const entityIdsToSet = chain_entity_ids.filter((id) => existingEntityIds.indexOf(id) === -1);
  const entitiesToSet = await models.ChainEntity.findAll({
    where: {
      id: { [Op.in]: entityIdsToSet }
    }
  });
  for (let i = 0; i < entitiesToSet.length; i++) {
    if (entitiesToSet[i].thread_id) {
      return next(new Error(Errors.ChainEntityAlreadyHasThread));
    }
    entitiesToSet[i].thread_id = thread_id;
    await entitiesToSet[i].save();
  }

  const finalThread = await models.OffchainThread.findOne({
    where: { id: thread_id, },
    include: [
      {
        model: models.Address,
        as: 'Address'
      },
      {
        model: models.Address,
        // through: models.Collaboration,
        as: 'collaborators'
      },
      models.OffchainAttachment,
      {
        model: models.OffchainTopic,
        as: 'topic'
      }
    ],
  });

  return res.json({ status: 'Success', result: finalThread.toJSON() });
};

export default updateThreadLinkedChainEntities;
