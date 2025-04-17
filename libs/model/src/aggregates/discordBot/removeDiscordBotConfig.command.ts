import { InvalidState, logger, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authRoles } from '../../middleware';
import { getDiscordClient } from '../../utils';

const log = logger(import.meta);

export const Errors = {
  ConfigNotFound: 'Config not found.',
};

export function RemoveDiscordBotConfig(): Command<
  typeof schemas.RemoveDiscordBotConfig
> {
  return {
    ...schemas.RemoveDiscordBotConfig,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const config = await models.DiscordBotConfig.findOne({
        where: {
          community_id: payload.community_id,
        },
      });
      if (!config) throw new InvalidState(Errors.ConfigNotFound);

      if (config.guild_id && config.guild_id !== '') {
        const client = await getDiscordClient();
        const guild = client.guilds.cache.get(config.guild_id);
        if (guild) {
          await guild.leave();
          log.trace(`Left Discord server: ${config.guild_id}`);
        } else {
          log.trace(`Could not find a server with ID: ${config.guild_id}`);
        }
      }

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
