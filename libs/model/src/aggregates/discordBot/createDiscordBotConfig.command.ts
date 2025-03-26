import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authRoles } from '../../middleware';

const TOKEN_EXPIRATION_MINUTES = 5;

export function CreateDiscordBotConfig(): Command<
  typeof schemas.CreateDiscordBotConfig
> {
  return {
    ...schemas.CreateDiscordBotConfig,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const { community_id, verification_token } = payload;
      const token_expiration = new Date(
        +new Date() + TOKEN_EXPIRATION_MINUTES * 60 * 1000,
      );

      const [, created] = await models.DiscordBotConfig.upsert({
        community_id,
        verification_token,
        token_expiration,
      });

      if (!created)
        return { message: 'Updated an existing discord bot config' };
      return { message: 'Created a new discord bot config' };
    },
  };
}
