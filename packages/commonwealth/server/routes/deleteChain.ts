import { AppError } from 'common-common/src/errors';
import type { NextFunction } from 'express';
import { Op } from 'sequelize';
import type { DB } from '../models';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import { findAllRoles } from '../util/roles';

export const Errors = {
  NotLoggedIn: 'Not logged in',
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
  next: NextFunction
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

  // eslint-disable-next-line no-new
  new Promise(async () => {
    await models.sequelize.transaction(async (t) => {
      const admins = await findAllRoles(models, {}, chain.id, ['admin']);
      if (admins) {
        // delete admin role assignments
        await models.RoleAssignment.destroy({
          where: {
            community_role_id:
              admins[0]._roleAssignmentAttributes.community_role_id,
          },
          transaction: t,
        });
      }
      // TODO: need a parallel API call to chain-events to destroy chain-entities there too
      await models.ChainEntityMeta.destroy({
        where: { chain: chain.id },
        transaction: t,
      });

      await models.User.update(
        {
          selected_chain_id: null,
        },
        {
          where: {
            selected_chain_id: chain.id,
          },
          transaction: t,
        }
      );

      await models.Reaction.destroy({
        where: { chain: chain.id },
        transaction: t,
      });

      await models.Comment.destroy({
        where: { chain: chain.id },
        transaction: t,
      });

      await models.Topic.destroy({
        where: { chain_id: chain.id },
        transaction: t,
      });

      await models.Role.destroy({
        where: { chain_id: chain.id },
        transaction: t,
      });

      await models.Subscription.destroy({
        where: { chain_id: chain.id },
        transaction: t,
      });

      await models.Webhook.destroy({
        where: { chain_id: chain.id },
        transaction: t,
      });

      const threads = await models.Thread.findAll({
        where: { chain: chain.id },
      });

      await models.Collaboration.destroy({
        where: { thread_id: { [Op.in]: threads.map((thread) => thread.id) } },
        transaction: t,
      });

      await models.Vote.destroy({
        where: { chain_id: chain.id },
        transaction: t,
      });

      await models.Poll.destroy({
        where: { chain_id: chain.id },
        transaction: t,
      });

      await models.Thread.destroy({
        where: { chain: chain.id },
        transaction: t,
      });

      await models.StarredCommunity.destroy({
        where: { chain: chain.id },
        transaction: t,
      });

      const addresses = await models.Address.findAll({
        where: { chain: chain.id },
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

      await models.RoleAssignment.destroy({
        where: { address_id: { [Op.in]: addresses.map((a) => a.id) } },
        transaction: t,
      });

      await models.Address.destroy({
        where: { chain: chain.id },
        transaction: t,
      });

      const communityRoles = await models.CommunityRole.findAll({
        where: { chain_id: chain.id },
        transaction: t,
      });

      await models.RoleAssignment.destroy({
        where: {
          community_role_id: { [Op.in]: communityRoles.map((r) => r.id) },
        },
        transaction: t,
      });

      await Promise.all(
        communityRoles.map((r) => r.destroy({ transaction: t }))
      );

      await models.Community.destroy({
        where: { id: chain.id },
        transaction: t,
      });
    });
  });

  return success(res, { result: 'success' });
};

export default deleteChain;
