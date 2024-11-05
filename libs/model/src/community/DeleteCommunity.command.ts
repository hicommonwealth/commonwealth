import { InvalidActor, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { ModelStatic } from 'sequelize';
import { models } from '../database';
import { AuthContext, isAuthorized } from '../middleware';
import { mustBeAuthorized, mustExist } from '../middleware/guards';
import { ModelInstance } from '../models';

export const DeleteCommunityErrors = {
  NotAdmin: 'Must be a site admin',
};

export function DeleteCommunity(): Command<
  typeof schemas.DeleteCommunity,
  AuthContext
> {
  return {
    ...schemas.DeleteCommunity,
    auth: [isAuthorized({ roles: ['admin'] })],
    body: async ({ actor, auth }) => {
      const { community_id } = mustBeAuthorized(actor, auth);

      if (!actor.user.isAdmin)
        throw new InvalidActor(actor, DeleteCommunityErrors.NotAdmin);

      const community = await models.Community.findOne({
        where: { id: community_id },
      });
      mustExist('Community', community);

      await models.sequelize.transaction(async (transaction) => {
        await models.User.update(
          { selected_community_id: null },
          {
            where: { selected_community_id: community_id },
            transaction,
          },
        );

        const addressesToDelete = (
          await models.Address.findAll({
            attributes: ['id'],
            where: { community_id },
            transaction,
          })
        ).map((a) => a.id!);

        const threadsToDelete = (
          await models.Thread.findAll({
            attributes: ['id'],
            where: { community_id },
            transaction,
            paranoid: false,
          })
        ).map((t) => t.id!);

        const commentsToDelete = (
          await models.Comment.findAll({
            attributes: ['id'],
            where: { thread_id: threadsToDelete },
            paranoid: false,
            transaction,
          })
        ).map((c) => c.id!);

        // TODO: use cascade delete instead of this?
        const addressIdModels: ModelStatic<
          ModelInstance<{ address_id: number }>
        >[] = [
          models.Reaction,
          models.Membership,
          models.Collaboration,
          models.SsoToken,
        ];
        for (const model of addressIdModels) {
          await model.destroy({
            where: { address_id: addressesToDelete },
            force: true,
            transaction,
          });
        }

        const commentIdModels: ModelStatic<
          ModelInstance<{ comment_id: number }>
        >[] = [models.CommentVersionHistory, models.CommentSubscription];
        for (const model of commentIdModels) {
          await model.destroy({
            where: { comment_id: commentsToDelete },
            force: true,
            transaction,
          });
        }

        await models.Comment.destroy({
          where: { id: commentsToDelete },
          force: true,
          transaction,
        });

        const threadIdModels: ModelStatic<
          ModelInstance<{ thread_id: number }>
        >[] = [models.ThreadVersionHistory, models.ThreadSubscription];
        for (const model of threadIdModels) {
          await model.destroy({
            where: { thread_id: threadsToDelete },
            force: true,
            transaction,
          });
        }

        const communityIdModels: ModelStatic<
          ModelInstance<{ community_id: string }>
        >[] = [
          models.CommunityAlert,
          models.CommunityStake,
          models.DiscordBotConfig,
          models.Topic,
          models.Webhook,
          models.Vote,
          models.Poll,
          models.Thread,
          models.StarredCommunity,
          models.Group,
          models.Address,
        ];
        for (const model of communityIdModels) {
          await model.destroy({
            where: { community_id },
            force: true,
            transaction,
          });
        }

        await models.Community.destroy({
          where: { id: community_id },
          transaction,
        });
      });

      return { community_id };
    },
  };
}
