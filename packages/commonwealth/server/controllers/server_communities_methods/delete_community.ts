import { AppError } from 'common-common/src/errors';
import { Op } from 'sequelize';
import { sequelize } from '../../database';
import { success } from '../../types';
import { ServerCommunitiesController } from '../server_communities_controller';
import { UserInstance } from 'server/models/user';

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

export type DeleteCommunityOptions = {
  user: UserInstance;
  id: string;
};
export type DeleteCommunityResult = void;

export async function __deleteCommunity(
  this: ServerCommunitiesController,
  { user, id }: DeleteCommunityOptions
): Promise<DeleteCommunityResult> {
  if (!user.isAdmin) {
    throw new AppError(Errors.NotAdmin);
  }

  if (!id) {
    throw new AppError(Errors.NeedChainId);
  }

  const chain = await this.models.Chain.findOne({
    where: {
      id,
      has_chain_events_listener: false, // make sure no chain events
    },
  });
  if (!chain) {
    throw new AppError(Errors.NoChain);
  }

  try {
    // eslint-disable-next-line no-new
    await new Promise<void>(async (resolve, reject) => {
      try {
        await this.models.sequelize.transaction(async (t) => {
          await this.models.User.update(
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

          await this.models.Reaction.destroy({
            where: { chain: chain.id },
            transaction: t,
          });

          // Add the created by field to comments for redundancy
          await sequelize.query(
            `UPDATE "Comments" SET created_by = (SELECT address FROM "Addresses" WHERE "Comments".address_id = "Addresses".id) WHERE chain = '${chain.id}'`,
            { transaction: t }
          );

          await this.models.Comment.destroy({
            where: { chain: chain.id },
            transaction: t,
          });

          await this.models.Topic.destroy({
            where: { chain_id: chain.id },
            transaction: t,
          });

          await this.models.Subscription.destroy({
            where: { chain_id: chain.id },
            transaction: t,
          });

          await this.models.CommunityContract.destroy({
            where: {
              chain_id: chain.id,
            },
            transaction: t,
          });

          await this.models.Webhook.destroy({
            where: { community_id: chain.id },
            transaction: t,
          });

          const threads = await this.models.Thread.findAll({
            where: { chain: chain.id },
            attributes: ['id'],
          });

          await this.models.Collaboration.destroy({
            where: {
              thread_id: { [Op.in]: threads.map((thread) => thread.id) },
            },
            transaction: t,
          });

          await this.models.Vote.destroy({
            where: { community_id: chain.id },
            transaction: t,
          });

          await this.models.Poll.destroy({
            where: { chain_id: chain.id },
            transaction: t,
          });

          // Add the created by field to threads for redundancy
          await sequelize.query(
            `UPDATE "Threads" SET created_by = (SELECT address FROM "Addresses" WHERE "Threads".address_id = "Addresses".id) WHERE chain = '${chain.id}'`,
            { transaction: t }
          );

          await this.models.Thread.destroy({
            where: { chain: chain.id },
            transaction: t,
          });

          await this.models.StarredCommunity.destroy({
            where: { chain: chain.id },
            transaction: t,
          });

          const addresses = await this.models.Address.findAll({
            where: { chain: chain.id },
          });

          await this.models.CommunityBanner.destroy({
            where: { chain_id: chain.id },
            transaction: t,
          });

          // notifications + notifications_read (cascade)
          await this.models.Notification.destroy({
            where: { chain_id: chain.id },
            transaction: t,
          });

          await this.models.Address.destroy({
            where: { chain: chain.id },
            transaction: t,
          });

          await this.models.Chain.destroy({
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
  } catch (e) {
    console.log(e);
    throw new AppError(Errors.CannotDeleteChain);
  }
}
