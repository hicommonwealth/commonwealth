import { InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isAuthorized, type AuthContext } from '../middleware';

export const Errors = {
  ConfigNotFound: 'Config not found.',
};

export function RemoveDiscordBotConfig(): Command<
  typeof schemas.RemoveDiscordBotConfig,
  AuthContext
> {
  return {
    ...schemas.RemoveDiscordBotConfig,
    auth: [isAuthorized({ roles: ['admin'] })],
    body: async ({ payload }) => {
      const config = await models.DiscordBotConfig.findOne({
        where: {
          community_id: payload.community_id,
        },
      });
      if (!config) throw new InvalidState(Errors.ConfigNotFound);

      await models.sequelize.transaction(async (transaction) => {
        await models.Community.update(
          {
            discord_config_id: null,
            discord_bot_webhooks_enabled: false,
          },
          {
            where: {
              id: payload.community_id,
            },
            transaction,
          },
        );
        await models.DiscordBotConfig.destroy({
          where: {
            community_id: payload.community_id,
          },
          transaction,
        });
        await models.Topic.update(
          { channel_id: null },
          {
            where: {
              community_id: payload.community_id,
            },
            transaction,
          },
        );
      });

      return { message: 'Successfully disconnected Discord' };
    },
  };
}
