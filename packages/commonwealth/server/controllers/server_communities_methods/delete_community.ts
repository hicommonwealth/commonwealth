import { AppError, logger } from '@hicommonwealth/core';
import { ModelInstance, UserInstance } from '@hicommonwealth/model';
import { type ModelStatic } from 'sequelize';
import { ServerCommunitiesController } from '../server_communities_controller';

const log = logger(import.meta);

export const Errors = {
  NotAdmin: 'Must be a site admin',
  NeedCommunityId: 'Must provide community id',
  NoCommunity: 'Community not found',
  CannotDeleteCommunity: 'Failed to delete community. Contact engineering.',
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
    await this.models.sequelize.transaction(async (transaction) => {
      await this.models.User.update(
        {
          selected_community_id: null,
        },
        {
          where: {
            selected_community_id: community.id,
          },
          transaction,
        },
      );

      const addressesToDelete = await this.models.Address.findAll({
        attributes: ['id'],
        where: {
          community_id: community.id!,
        },
        transaction,
      });
      const addressIdModels: ModelStatic<
        ModelInstance<{ address_id: number }>
      >[] = [
        this.models.Reaction,
        this.models.Membership,
        this.models.Collaboration,
        this.models.SsoToken,
      ];
      for (const model of addressIdModels) {
        await model.destroy({
          where: {
            address_id: addressesToDelete.map((c) => c.id!),
          },
          force: true,
          transaction,
        });
      }

      const threadsToDelete = (
        await this.models.Thread.findAll({
          attributes: ['id'],
          where: {
            community_id: community.id,
          },
          transaction,
          paranoid: false,
        })
      ).map((t) => t.id!);
      const commentsToDelete = (
        await this.models.Comment.findAll({
          attributes: ['id'],
          where: {
            thread_id: threadsToDelete,
          },
          paranoid: false,
          transaction,
        })
      ).map((c) => c.id!);

      const commentIdModels: ModelStatic<
        ModelInstance<{ comment_id: number }>
      >[] = [
        this.models.CommentVersionHistory,
        this.models.CommentSubscription,
      ];
      for (const model of commentIdModels) {
        await model.destroy({
          where: {
            comment_id: commentsToDelete,
          },
          force: true,
          transaction,
        });
      }

      await this.models.Comment.destroy({
        where: {
          id: commentsToDelete,
        },
        force: true,
        transaction,
      });

      const threadIdModels: ModelStatic<
        ModelInstance<{ thread_id: number }>
      >[] = [this.models.ThreadVersionHistory, this.models.ThreadSubscription];
      for (const model of threadIdModels) {
        await model.destroy({
          where: {
            thread_id: threadsToDelete,
          },
          force: true,
          transaction,
        });
      }

      const models: ModelStatic<ModelInstance<{ community_id: string }>>[] = [
        this.models.CommunityAlert,
        this.models.CommunityStake,
        this.models.DiscordBotConfig,
        this.models.Topic,
        this.models.CommunityContract,
        this.models.Webhook,
        this.models.Vote,
        this.models.Poll,
        this.models.Thread,
        this.models.StarredCommunity,
        this.models.Group,
        this.models.Address,
      ];

      for (const model of models) {
        await model.destroy({
          where: { community_id: community.id },
          force: true,
          transaction,
        });
      }

      await this.models.Community.destroy({
        where: { id: community.id },
        transaction,
      });
    });
  } catch (e) {
    log.error(`Failed to delete community ${community.id!}`, e);
    throw new AppError(Errors.CannotDeleteCommunity);
  }
}
