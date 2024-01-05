import { AppError } from 'common-common/src/errors';
import type { NextFunction } from 'express';
import { Op } from 'sequelize';
import { sequelize } from '../database';
import type { DB } from '../models';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

export const Errors = {
  NotLoggedIn: 'Not signed in',
  NotAdmin: 'Must be a site admin',
  NeedChainId: 'Must provide chain id',
  NoChain: 'Chain not found',
  CannotDeleteChain: 'Cannot delete this protected chain',
  NotAcceptableAdmin: 'Not an Acceptable Admin',
  BadSecret: 'Must provide correct secret',
  AdminPresent:
    'There exists an admin in this community, cannot delete if there is an admin!',
};

// const protectedIdList = [];

type deleteChainReq = {
  id: string;
};

type deleteChainResp = { result: string };

const deleteChain = async (
  models: DB,
  req: TypedRequestBody<deleteChainReq>,
  res: TypedResponse<deleteChainResp>,
  next: NextFunction,
) => {
  const { id } = req.body;

  if (!req.user.isAdmin) {
    return next(new AppError(Errors.NotAdmin));
  }

  if (!id) {
    return next(new AppError(Errors.NeedChainId));
  }

  // if (protectedIdList.includes(id)) {
  //   return next(new AppError(Errors.CannotDeleteChain));
  // }

  const chain = await models.Community.findOne({
    where: {
      id,
      has_chain_events_listener: false, // make sure no chain events
    },
  });
  if (!chain) {
    return next(new AppError(Errors.NoChain));
  }

  try {
    // eslint-disable-next-line no-new
    await new Promise<void>(async (resolve, reject) => {
      try {
        await models.sequelize.transaction(async (t) => {
          await models.User.update(
            {
              selected_chain_id: null,
            },
            {
              where: {
                selected_chain_id: chain.id,
              },
              transaction: t,
            },
          );

          await models.Reaction.destroy({
            where: { chain: chain.id },
            transaction: t,
          });

          // Add the created by field to comments for redundancy
          await sequelize.query(
            `UPDATE "Comments"
                 SET created_by = (
                    SELECT address
                    FROM "Addresses"
                    WHERE "Comments".address_id = "Addresses".id)
                 WHERE chain = '${chain.id}'`,
            { transaction: t },
          );

          await models.Comment.destroy({
            where: { chain: chain.id },
            transaction: t,
          });

          await models.Topic.destroy({
            where: { community_id: chain.id },
            transaction: t,
          });

          await models.Subscription.destroy({
            where: { chain_id: chain.id },
            transaction: t,
          });

          await models.CommunityContract.destroy({
            where: {
              chain_id: chain.id,
            },
            transaction: t,
          });

          await models.Webhook.destroy({
            where: { community_id: chain.id },
            transaction: t,
          });

          const threads = await models.Thread.findAll({
            where: { chain: chain.id },
            attributes: ['id'],
          });

          await models.Collaboration.destroy({
            where: {
              thread_id: { [Op.in]: threads.map((thread) => thread.id) },
            },
            transaction: t,
          });

          await models.Vote.destroy({
            where: { community_id: chain.id },
            transaction: t,
          });

          await models.Poll.destroy({
            where: { community_id: chain.id },
            transaction: t,
          });

          // Add the created by field to threads for redundancy
          await sequelize.query(
            `UPDATE "Threads"
                 SET created_by = (
                    SELECT address
                    FROM "Addresses"
                    WHERE "Threads".address_id = "Addresses".id)
                 WHERE chain = '${chain.id}'`,
            { transaction: t },
          );

          await models.Thread.destroy({
            where: { chain: chain.id },
            transaction: t,
          });

          await models.StarredCommunity.destroy({
            where: { chain: chain.id },
            transaction: t,
          });

          await models.CommunityBanner.destroy({
            where: { chain_id: chain.id },
            transaction: t,
          });

          // notifications + notifications_read (cascade)
          await models.Notification.destroy({
            where: { chain_id: chain.id },
            transaction: t,
          });

          await models.Address.destroy({
            where: { community_id: chain.id },
            transaction: t,
          });

          await models.Community.destroy({
            where: { id: chain.id },
            transaction: t,
          });

          resolve();
        });
      } catch (e) {
        console.log(e);
        reject(e);
      }
    });

    return success(res, { result: 'success' });
  } catch (e) {
    console.log(e);
    return next(new AppError(Errors.CannotDeleteChain));
  }
};

export default deleteChain;
