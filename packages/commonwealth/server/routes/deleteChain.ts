import { Request, Response, NextFunction } from 'express';
import { QueryTypes } from 'sequelize';
import { factory, formatFilename } from 'common-common/src/logging';
import { TypedRequestBody, TypedResponse, success } from '../types';
import { DB } from '../models';
import { AppError, ServerError } from '../util/errors';
import { findAllRoles, findOneRole } from '../util/roles';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NotAdmin: 'Must be admin',
  NeedChainId: 'Must provide chain id',
  NoChain: 'Chain not found',
  CannotDeleteChain: 'Cannot delete this protected chain',
  NotAcceptableAdmin: 'Not an Acceptable Admin',
  BadSecret: 'Must provide correct secret',
  AdminPresent: 'There exists an admin in this community, cannot delete if there is an admin!',
};

// const protectedIdList = [];

type deleteChainReq = {
  id: string;
  airplaneSecret?: string;
  airplaneManualSecret?: string;
};

type deleteChainResp = { result: string };

const deleteChain = async (
  models: DB,
  req: TypedRequestBody<deleteChainReq>,
  res: TypedResponse<deleteChainResp>,
  next: NextFunction
) => {
  const { id, airplaneSecret, airplaneManualSecret } = req.body;

  if (
    !process.env.AIRPLANE_DELETE_COMMUNITY_SECRET ||
    airplaneSecret !== process.env.AIRPLANE_DELETE_COMMUNITY_SECRET
  ) {
    return next(new AppError(Errors.BadSecret));
  }

  // Check Manually typed in secret
  if (
    !process.env.AIRPLANE_DELETE_COMMUNITY_MANUAL_SECRET ||
    airplaneManualSecret !== process.env.AIRPLANE_DELETE_COMMUNITY_MANUAL_SECRET
  ) {
    return next(new AppError(Errors.BadSecret));
  }

  if (!id) {
    return next(new AppError(Errors.NeedChainId));
  }

  // if (protectedIdList.includes(id)) {
  //   return next(new AppError(Errors.CannotDeleteChain));
  // }

  await models.sequelize.transaction(async (t) => {
    const chain = await models.Chain.findOne({
      where: {
        id,
        has_chain_events_listener: false, // make sure no chain events
      },
    });
    if (!chain) {
      return next(new AppError(Errors.NoChain));
    }

    const admin = await findOneRole(models, {}, chain.id, ['admin']);
    if (!admin) {
      return next(new AppError(Errors.AdminPresent))
    }

    await models.sequelize.query(
      `DELETE FROM "ChainEntities" WHERE chain='${chain.id}';`,
      {
        type: QueryTypes.DELETE,
        transaction: t,
      }
    );

    await models.sequelize.query(
      `UPDATE "Users" SET "selected_chain_id" = NULL WHERE "selected_chain_id" = '${chain.id}';`,
      {
        type: QueryTypes.DELETE,
        transaction: t,
      }
    );

    await models.sequelize.query(
      `DELETE FROM "Reactions" WHERE chain='${chain.id}';`,
      {
        type: QueryTypes.DELETE,
        transaction: t,
      }
    );

    await models.sequelize.query(
      `DELETE FROM "Comments" WHERE chain='${chain.id}';`,
      {
        type: QueryTypes.DELETE,
        transaction: t,
      }
    );

    await models.sequelize.query(
      `DELETE FROM "Topics" WHERE chain_id='${chain.id}';`,
      {
        type: QueryTypes.DELETE,
        transaction: t,
      }
    );

    await models.sequelize.query(
      `DELETE FROM "Roles" WHERE chain_id='${chain.id}';`,
      {
        type: QueryTypes.DELETE,
        transaction: t,
      }
    );

    await models.sequelize.query(
      `DELETE FROM "InviteCodes" WHERE chain_id='${chain.id}';`,
      {
        type: QueryTypes.DELETE,
        transaction: t,
      }
    );

    await models.sequelize.query(
      `DELETE FROM "Subscriptions" WHERE chain_id='${chain.id}';`,
      {
        type: QueryTypes.DELETE,
        transaction: t,
      }
    );

    await models.sequelize.query(
      `DELETE FROM "Webhooks" WHERE chain_id='${chain.id}';`,
      {
        type: QueryTypes.DELETE,
        transaction: t,
      }
    );

    await models.sequelize.query(
      `DELETE FROM "Collaborations"
        USING "Collaborations" AS c
        LEFT JOIN "Threads" t ON thread_id = t.id
        WHERE t.chain = '${chain.id}'
        AND c.thread_id  = "Collaborations".thread_id 
        AND c.address_id = "Collaborations".address_id;`,
      {
        raw: true,
        type: QueryTypes.DELETE,
        transaction: t,
      }
    );

    await models.sequelize.query(
      `DELETE FROM "LinkedThreads"
        USING "LinkedThreads" AS l
        LEFT JOIN "Threads" t ON linked_thread = t.id
        WHERE t.chain = '${chain.id}';`,
      {
        type: QueryTypes.DELETE,
        transaction: t,
      }
    );

    await models.sequelize.query(
      `DELETE FROM "Votes" WHERE chain_id='${chain.id}';`,
      {
        type: QueryTypes.DELETE,
        transaction: t,
      }
    );

    await models.sequelize.query(
      `DELETE FROM "Polls" WHERE chain_id='${chain.id}';`,
      {
        type: QueryTypes.DELETE,
        transaction: t,
      }
    );

    await models.sequelize.query(
      `DELETE FROM "Threads" WHERE chain='${chain.id}';`,
      {
        type: QueryTypes.DELETE,
        transaction: t,
      }
    );

    await models.sequelize.query(
      `DELETE FROM "StarredCommunities" WHERE chain='${chain.id}';`,
      {
        type: QueryTypes.DELETE,
        transaction: t,
      }
    );

    await models.sequelize.query(
      `DELETE FROM "OffchainProfiles" AS profilesGettingDeleted
        USING "OffchainProfiles" AS profilesBeingUsedAsReferences
        LEFT JOIN "Addresses" a ON profilesBeingUsedAsReferences.address_id = a.id
        WHERE a.chain = '${chain.id}'
        AND profilesGettingDeleted.address_id  = profilesBeingUsedAsReferences.address_id;`,
      {
        type: QueryTypes.DELETE,
        transaction: t,
      }
    );

    await models.sequelize.query(
      `DELETE FROM "ChainCategories" WHERE chain_id='${chain.id}';`,
      {
        type: QueryTypes.DELETE,
        transaction: t,
      }
    );

    await models.sequelize.query(
      `DELETE FROM "CommunityBanners" WHERE chain_id='${chain.id}';`,
      {
        type: QueryTypes.DELETE,
        transaction: t,
      }
    );

    await models.sequelize.query(
      `DELETE FROM "ChainEventTypes" WHERE chain='${chain.id}';`,
      {
        type: QueryTypes.DELETE,
        transaction: t,
      }
    );

    // notifications + notifications_read (cascade)
    await models.sequelize.query(
      `DELETE FROM "Notifications" WHERE chain_id='${chain.id}';`,
      {
        type: QueryTypes.DELETE,
        transaction: t,
      }
    );

    // TODO: Remove this once we figure out a better way to relate addresses across many chains (token communities)
    await models.sequelize.query(
      `DELETE FROM "Addresses" WHERE chain='${chain.id}';`,
      {
        type: QueryTypes.DELETE,
        transaction: t,
      }
    );

    await models.sequelize.query(
      `DELETE FROM "Chains" WHERE id='${chain.id}';`,
      {
        type: QueryTypes.DELETE,
        transaction: t,
      }
    );
  });

  return success(res, { result: 'Deleted Chain' });
};

export default deleteChain;
