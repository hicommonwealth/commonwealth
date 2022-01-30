import { Request, Response, NextFunction } from 'express';
import { QueryTypes } from 'sequelize';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NotAdmin: 'Must be admin',
  NeedChainId: 'Must provide chain id',
  NoChain: 'Chain not found',
  CannotDeleteChain: 'Cannot delete a chain with registered addresses',
  NotAcceptableAdmin: 'Not an Acceptable Admin'
};

const deleteChain = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.user.isAdmin) {
    return next(new Error(Errors.NotAdmin));
  }
  if (!req.body.id) {
    return next(new Error(Errors.NeedChainId));
  }
  if (!['george@commonwealth.im', 'zak@commonwealth.im', 'jake@commonwealth.im'].includes(req.user.email)) {
    return next(new Error(Errors.NotAcceptableAdmin));
  }

  await models.sequelize.transaction(async (t) => {
    const chain = await models.Chain.findOne({
      where: {
        id: req.body.id,
      }
    });
    if (!chain) {
      return next(new Error(Errors.NoChain));
    }

    await models.sequelize.query(`DELETE FROM "ChainNodes" WHERE chain='${chain.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    await models.sequelize.query(`DELETE FROM "ChainEntities" WHERE chain='${chain.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    await models.sequelize.query(`DELETE FROM "OffchainReactions" WHERE chain='${chain.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    await models.sequelize.query(`DELETE FROM "OffchainComments" WHERE chain='${chain.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    await models.sequelize.query(`DELETE FROM "OffchainTopics" WHERE chain_id='${chain.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    await models.sequelize.query(`DELETE FROM "Roles" WHERE chain_id='${chain.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    await models.sequelize.query(`DELETE FROM "InviteCodes" WHERE chain_id='${chain.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    await models.sequelize.query(`DELETE FROM "Subscriptions" WHERE chain_id='${chain.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    await models.sequelize.query(`DELETE FROM "Webhooks" WHERE chain_id='${chain.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    await models.sequelize.query(`DELETE FROM "Collaborations"
        USING "Collaborations" AS c
        LEFT JOIN "OffchainThreads" t ON offchain_thread_id = t.id
        WHERE t.chain = '${chain.id}'
        AND c.offchain_thread_id  = "Collaborations".offchain_thread_id 
        AND c.address_id = "Collaborations".address_id `, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    await models.sequelize.query(`DELETE FROM "LinkedThreads"
        USING "LinkedThreads" AS l
        LEFT JOIN "OffchainThreads" t ON linked_thread = t.id
        WHERE t.chain = '${chain.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    await models.sequelize.query(`DELETE FROM "OffchainThreads" WHERE chain='${chain.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    await models.sequelize.query(`DELETE FROM "StarredCommunities" WHERE chain='${chain.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    await models.sequelize.query(`DELETE FROM "OffchainProfiles" AS profilesGettingDeleted
        USING "OffchainProfiles" AS profilesBeingUsedAsReferences
        LEFT JOIN "Addresses" a ON profilesBeingUsedAsReferences.address_id = a.id
        WHERE a.chain = '${chain.id}'
        AND profilesGettingDeleted.address_id  = profilesBeingUsedAsReferences.address_id;`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    await models.sequelize.query(`DELETE FROM "Addresses" WHERE chain='${chain.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    await models.sequelize.query(`DELETE FROM "ChainEventTypes" WHERE chain='${chain.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    await chain.destroy({transaction: t});
  });

  return res.json({ status: 'Success', result: 'Deleted chain' });
};

export default deleteChain;
