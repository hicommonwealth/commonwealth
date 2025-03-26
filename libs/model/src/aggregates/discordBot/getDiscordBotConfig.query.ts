import { type Query } from '@hicommonwealth/core';
import { GetDiscordBotConfig as GetDiscordBotConfigSchema } from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authRoles } from '../../middleware';

export function GetDiscordBotConfig(): Query<typeof GetDiscordBotConfigSchema> {
  return {
    ...GetDiscordBotConfigSchema,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const configEntry = await models.DiscordBotConfig.findOne({
        where: {
          community_id: payload.community_id,
        },
      });
      return configEntry?.toJSON();
    },
  };
}
