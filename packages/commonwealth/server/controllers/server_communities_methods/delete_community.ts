import { AppError } from '@hicommonwealth/core';
import { ModelInstance, UserInstance, sequelize } from '@hicommonwealth/model';
import { Op, type ModelStatic } from 'sequelize';
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

          // Add the created by field to comments for redundancy
          await sequelize.query(
            `UPDATE "Comments" SET
                created_by = (SELECT address FROM "Addresses" WHERE "Comments".address_id = "Addresses".id)
             WHERE community_id = '${community.id}'`,
            { transaction: t },
          );

          const threads = await this.models.Thread.findAll({
            where: { community_id: community.id },
            attributes: ['id'],
            paranoid: false, // necessary in order to delete associations with soft-deleted threads
          });

          // Add the created by field to threads for redundancy
          await sequelize.query(
            `UPDATE "Threads" SET
                created_by = (SELECT address FROM "Addresses" WHERE "Threads".address_id = "Addresses".id)
             WHERE community_id = :community_id`,
            { transaction: t, replacements: { community_id: community.id } },
          );

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

          const models: ModelStatic<
            ModelInstance<{ community_id?: string }>
          >[] = [
            // @ts-expect-error StrictNullChecks
            this.models.CommunityStake,
            // @ts-expect-error StrictNullChecks
            this.models.DiscordBotConfig,
            // @ts-expect-error StrictNullChecks
            this.models.Ban,
            // @ts-expect-error StrictNullChecks
            this.models.Reaction,
            // @ts-expect-error StrictNullChecks
            this.models.Comment,
            // @ts-expect-error StrictNullChecks
            this.models.Topic,
            this.models.Subscription,
            // @ts-expect-error StrictNullChecks
            this.models.CommunityContract,
            // @ts-expect-error StrictNullChecks
            this.models.Webhook,
            // @ts-expect-error StrictNullChecks
            this.models.Vote,
            // @ts-expect-error StrictNullChecks
            this.models.Poll,
            // @ts-expect-error StrictNullChecks
            this.models.Thread,
            // @ts-expect-error StrictNullChecks
            this.models.StarredCommunity,
            // @ts-expect-error StrictNullChecks
            this.models.CommunityBanner,
            this.models.Notification,
            // @ts-expect-error StrictNullChecks
            this.models.Group,
            // @ts-expect-error StrictNullChecks
            this.models.Address,
          ];

          for (const model of models) {
            await model.destroy({
              where: { community_id: community.id },
              force: true,
              transaction: t,
            });
          }

          await this.models.Collaboration.destroy({
            // @ts-expect-error StrictNullChecks
            where: {
              thread_id: { [Op.in]: threads.map((thread) => thread.id) },
            },
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
