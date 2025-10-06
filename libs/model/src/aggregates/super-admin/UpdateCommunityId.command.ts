import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { ModelStatic } from 'sequelize';
import { models } from '../../database';
import { isSuperAdmin, mustExist, mustNotExist } from '../../middleware';
import { ModelInstance } from '../../models';

export function UpdateCommunityId(): Command<typeof schemas.UpdateCommunityId> {
  return {
    ...schemas.UpdateCommunityId,
    auth: [isSuperAdmin],
    secure: true,
    body: async ({ payload }) => {
      const { community_id, new_community_id } = payload;

      const community = await models.Community.findOne({
        where: { id: community_id },
      });
      mustExist('Community', community);

      const existingRedirect = await models.Community.findOne({
        where: { redirect: community_id },
      });
      mustNotExist('Community redirect', existingRedirect);

      const existingCommunity = await models.Community.findOne({
        where: { id: new_community_id },
      });
      mustNotExist('Community with new ID', existingCommunity);

      const created = await models.sequelize.transaction(
        async (transaction) => {
          const { id, ...other } = community.toJSON();
          const new_community = await models.Community.create(
            {
              id: new_community_id,
              ...other,
              redirect: community_id,
              network: other.network === id ? new_community_id : other.network,
            },
            { transaction },
          );

          // TODO: a txn like this could cause deadlocks.
          //  A more thorough process where we disable the original community
          //  and gradually transfer data to the new community is likely required
          //  in the long-term. Alternative is to gradually duplicate the data
          //  and then delete the old data once redirect from old to new community
          //  is enabled
          const to_update: ModelStatic<
            ModelInstance<{ community_id: string }>
          >[] = [
            models.Address,
            models.Topic,
            models.Thread,
            models.Poll,
            models.StarredCommunity,
            models.Vote,
            models.Webhook,
            models.CommunityStake,
            models.DiscordBotConfig,
            models.Group,
          ];
          for (const model of to_update) {
            await model.update(
              { community_id: new_community_id },
              { where: { community_id }, transaction },
            );
          }

          await models.User.update(
            { selected_community_id: new_community_id },
            {
              where: { selected_community_id: community_id },
              transaction,
            },
          );

          await models.Vote.update(
            { author_community_id: new_community_id },
            {
              where: { author_community_id: community_id },
              transaction,
            },
          );

          await models.Community.destroy({
            where: { id: community_id },
            transaction,
          });

          return new_community;
        },
      );

      return created.toJSON();
    },
  };
}
