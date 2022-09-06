import { Request, Response, NextFunction } from 'express';
import { QueryTypes } from 'sequelize';
import { factory, formatFilename } from 'common-common/src/logging';
import { DB } from '../database';
import {RabbitMQController, RascalPublications} from "common-common/src/rabbitmq";

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NotAdmin: 'Must be admin',
  NeedChainId: 'Must provide chain id',
  NoChain: 'Chain not found',
  CannotDeleteChain: 'Cannot delete a chain with registered addresses',
  NotAcceptableAdmin: 'Not an Acceptable Admin'
};

const deleteChain = async (models: DB, rabbitMQController: RabbitMQController, req: Request, res: Response, next: NextFunction) => {
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

    await models.sequelize.query(`DELETE FROM "ChainEntities" WHERE chain='${chain.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    await models.sequelize.query(
      `UPDATE "Users" SET "selected_chain_id" = NULL WHERE "selected_chain_id" = '${chain.id}';`, {
        type: QueryTypes.DELETE,
        transaction: t,
      });

    await models.sequelize.query(`DELETE FROM "Reactions" WHERE chain='${chain.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    await models.sequelize.query(`DELETE FROM "Comments" WHERE chain='${chain.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    await models.sequelize.query(`DELETE FROM "Topics" WHERE chain_id='${chain.id}';`, {
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
        LEFT JOIN "Threads" t ON thread_id = t.id
        WHERE t.chain = '${chain.id}'
        AND c.thread_id  = "Collaborations".thread_id 
        AND c.address_id = "Collaborations".address_id;`, {
      raw: true,
      type: QueryTypes.DELETE,
      transaction: t,
    });

    await models.sequelize.query(`DELETE FROM "LinkedThreads"
        USING "LinkedThreads" AS l
        LEFT JOIN "Threads" t ON linked_thread = t.id
        WHERE t.chain = '${chain.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    await models.sequelize.query(`DELETE FROM "Votes" WHERE chain_id='${chain.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    await models.sequelize.query(`DELETE FROM "Polls" WHERE chain_id='${chain.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    await models.sequelize.query(`DELETE FROM "Threads" WHERE chain='${chain.id}';`, {
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

    await models.sequelize.query(`DELETE FROM "ChainCategories" WHERE chain_id='${chain.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    await models.sequelize.query(`DELETE FROM "CommunityBanners" WHERE chain_id='${chain.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    await models.sequelize.query(`DELETE FROM "ChainEventTypes" WHERE chain='${chain.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    // notifications + notifications_read (cascade)
    await models.sequelize.query(`DELETE FROM "Notifications" WHERE chain_id='${chain.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    // TODO: Remove this once we figure out a better way to relate addresses across many chains (token communities)
    await models.sequelize.query(`DELETE FROM "Addresses" WHERE chain='${chain.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    await models.sequelize.query(`DELETE FROM "Chains" WHERE id='${chain.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });

    // if publishing fails, the entire transaction will roll back so no data inconsistencies occur
    await rabbitMQController.publish({chain_id: req.body.id, cud: 'delete-chain'}, RascalPublications.ChainCUDChainEvents);
  });

  return res.json({ status: 'Success', result: 'Deleted chain' });
};

export default deleteChain;
