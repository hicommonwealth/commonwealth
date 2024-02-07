import { AppError } from '@hicommonwealth/core';
import { UserInstance, sequelize } from '@hicommonwealth/model';
import { Op } from 'sequelize';
import { ServerCommunitiesController } from '../server_communities_controller';

export const Errors = {
  NotLoggedIn: 'Not signed in',
  NotAdmin: 'Must be a site admin',
  NeedCommunityId: 'Must provide community id',
  NoCommunity: 'Community not found',
  CannotDeleteCommunity: 'Cannot delete this protected community',
  NotAcceptableAdmin: 'Not an Acceptable Admin',
  BadSecret: 'Must provide correct secret',
  AdminPresent:
    'There exists an admin in this community, cannot delete if there is an admin!',
};

export type DeleteCommunityOptions = {
  user: UserInstance;
  communityId: string;
};
export type DeleteCommunityResult = void;

export async function __deleteCommunity(
  this: ServerCommunitiesController,
  { user, communityId }: DeleteCommunityOptions,
): Promise<DeleteCommunityResult> {
  if (!user.isAdmin) {
    throw new AppError(Errors.NotAdmin);
  }

  if (!communityId) {
    throw new AppError(Errors.NeedCommunityId);
  }

  const community = await this.models.Community.findOne({
    where: {
      id: communityId,
    },
  });
  if (!community) {
    throw new AppError(Errors.NoCommunity);
  }

  try {
    // eslint-disable-next-line no-new
    await new Promise<void>(async (resolve, reject) => {
      try {
        await this.models.sequelize.transaction(async (t) => {
          await this.models.User.update(
            {
              selected_community_id: null,
            },
            {
              where: {
                selected_community_id: community.id,
              },
              transaction: t,
            },
          );

          await this.models.Reaction.destroy({
            where: { community_id: community.id },
            transaction: t,
          });

          // Add the created by field to comments for redundancy
          await sequelize.query(
            `UPDATE "Comments" SET
                created_by = (SELECT address FROM "Addresses" WHERE "Comments".address_id = "Addresses".id)
             WHERE community_id = '${community.id}'`,
            { transaction: t },
          );

          await this.models.Comment.destroy({
            where: { community_id: community.id },
            transaction: t,
          });

          await this.models.Topic.destroy({
            where: { community_id: community.id },
            transaction: t,
          });

          await this.models.Subscription.destroy({
            where: { community_id: community.id },
            transaction: t,
          });

          await this.models.CommunityContract.destroy({
            where: {
              community_id: community.id,
            },
            transaction: t,
          });

          await this.models.Webhook.destroy({
            where: { community_id: community.id },
            transaction: t,
          });

          const threads = await this.models.Thread.findAll({
            where: { community_id: community.id },
            attributes: ['id'],
            paranoid: false, // necessary in order to delete associations with soft-deleted threads
          });

          await this.models.Collaboration.destroy({
            where: {
              thread_id: { [Op.in]: threads.map((thread) => thread.id) },
            },
            transaction: t,
          });

          await this.models.Vote.destroy({
            where: { community_id: community.id },
            transaction: t,
          });

          await this.models.Poll.destroy({
            where: { community_id: community.id },
            transaction: t,
          });

          // Add the created by field to threads for redundancy
          await sequelize.query(
            `UPDATE "Threads" SET
                created_by = (SELECT address FROM "Addresses" WHERE "Threads".address_id = "Addresses".id)
             WHERE community_id = :community_id`,
            { transaction: t, replacements: { community_id: community.id } },
          );

          await this.models.Thread.destroy({
            where: { community_id: community.id },
            transaction: t,
          });

          await this.models.StarredCommunity.destroy({
            where: { community_id: community.id },
            transaction: t,
          });

          await this.models.Address.findAll({
            where: { community_id: community.id },
          });

          await this.models.CommunityBanner.destroy({
            where: { community_id: community.id },
            transaction: t,
          });

          // notifications + notifications_read (cascade)
          await this.models.Notification.destroy({
            where: { community_id: community.id },
            transaction: t,
          });

          await this.models.sequelize.query(
            `
            WITH addresses_to_delete AS (
                SELECT id 
                FROM "Addresses"
                WHERE community_id = :community_id
            ) DELETE FROM "Memberships" M
            USING addresses_to_delete atd
            WHERE atd.id = M.address_id;
          `,
            {
              transaction: t,
              replacements: {
                community_id: community.id,
              },
            },
          );

          await this.models.Group.destroy({
            where: {
              community_id: community.id,
            },
            transaction: t,
          });

          await this.models.sequelize.query(
            `
            WITH addresses_to_delete AS (
                SELECT id 
                FROM "Addresses"
                WHERE community_id = :community_id
            ) DELETE FROM "Collaborations" C
            USING addresses_to_delete atd
            WHERE atd.id = C.address_id;
          `,
            {
              transaction: t,
              replacements: {
                community_id: community.id,
              },
            },
          );

          await this.models.Address.destroy({
            where: { community_id: community.id },
            transaction: t,
          });

          await this.models.Community.destroy({
            where: { id: community.id },
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
    throw new AppError(Errors.CannotDeleteCommunity);
  }
}
