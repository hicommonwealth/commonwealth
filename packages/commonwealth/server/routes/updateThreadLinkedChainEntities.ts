import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';
import { link, linkSource } from '../models/thread';
import type { DB } from '../models';
import { findAllRoles } from '../util/roles';

export const Errors = {
  NoThread: 'Cannot find thread',
  NotAdminOrOwner: 'Not an admin or owner of this thread',
  ChainEntityAlreadyHasThread: 'Proposal linked to another thread',
};

const updateThreadLinkedChainEntities = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const chain = req.chain;
  const { thread_id } = req.body;

  const thread = await models.Thread.findOne({
    where: {
      id: thread_id,
    },
  });
  if (!thread) return next(new AppError(Errors.NoThread));
  const userOwnedAddressIds = (await req.user.getAddresses())
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);
  if (!userOwnedAddressIds.includes(thread.address_id)) {
    // is not author
    const roles = await findAllRoles(
      models,
      { where: { address_id: { [Op.in]: userOwnedAddressIds } } },
      chain.id,
      ['admin', 'moderator']
    );
    const role = roles.find((r) => {
      return r.chain_id === thread.chain;
    });
    if (!role) return next(new AppError(Errors.NotAdminOrOwner));
  }

  const chain_entity_ids =
    typeof req.body['chain_entity_id[]'] === 'string'
      ? [req.body['chain_entity_id[]']]
      : req.body['chain_entity_id[]']
      ? req.body['chain_entity_id[]'].map((id) => +id)
      : [];

  // remove any chain entities no longer linked to this thread
  const existingChainEntities = await models.ChainEntityMeta.findAll({
    where: { thread_id },
  });
  const entitiesToClear = existingChainEntities.filter(
    (ce) => chain_entity_ids.indexOf(ce.id) === -1
  );

  for (let i = 0; i < entitiesToClear.length; i++) {
    entitiesToClear[i].thread_id = null;
    await entitiesToClear[i].save();
  }

  // add any chain entities newly linked to this thread
  const existingEntityIds = existingChainEntities.map((ce) => ce.id);
  const entityIdsToSet = chain_entity_ids.filter(
    (id) => existingEntityIds.indexOf(id) === -1
  );
  const entitiesToSet = await models.ChainEntityMeta.findAll({
    where: {
      id: { [Op.in]: entityIdsToSet },
    },
  });

  const links: link[] = []
  for (let i = 0; i < entitiesToSet.length; i++) {
    if (entitiesToSet[i].thread_id) {
      return next(new AppError(Errors.ChainEntityAlreadyHasThread));
    }
    links.push({'source': linkSource.ChainEventsProposal, 'identifier': entitiesToSet[i].ce_id.toString()})
    entitiesToSet[i].thread_id = thread_id;
    await entitiesToSet[i].save();
  }

  if(!thread.links){
    thread.links = links
  }else{
    // Remove links no longer linked
    thread.links = thread.links.filter(link => {
      return !(link.source === linkSource.ChainEventsProposal
         && entitiesToClear.map(ent => ent.ce_id.toString()).includes(link.identifier));
    });
    //add new links
    thread.links.concat(links)
  }
  await thread.save();

  const finalThread = await models.Thread.findOne({
    where: { id: thread_id },
    include: [
      {
        model: models.Address,
        as: 'Address',
      },
      {
        model: models.Address,
        // through: models.Collaboration,
        as: 'collaborators',
      },
      models.Attachment,
      {
        model: models.Topic,
        as: 'topic',
      },
    ],
  });

  return res.json({ status: 'Success', result: finalThread.toJSON() });
};

export default updateThreadLinkedChainEntities;
