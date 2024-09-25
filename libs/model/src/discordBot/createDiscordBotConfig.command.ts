import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isAuthorized, type AuthContext } from '../middleware';

const TOKEN_EXPIRATION_MINUTES = 5;
export const Errors = {};

export function CreateDiscordBotConfig(): Command<
  typeof schemas.CreateDiscordBotConfig,
  AuthContext
> {
  return {
    ...schemas.CreateDiscordBotConfig,
    auth: [isAuthorized({ roles: ['admin'] })],
    body: async ({ payload }) => {
      const { community_id, verification_token } = payload;
      const token_expiration = new Date(
        +new Date() + TOKEN_EXPIRATION_MINUTES * 60 * 1000,
      );

      const existing = await models.DiscordBotConfig.findOne({
        where: {
          community_id,
        },
      });

      if (existing) {
        const existingConfig = await existing.update(
          {
            verification_token,
            token_expiration,
          },
          {
            where: {
              community_id,
            },
          },
        );

        await models.Community.update(
          { discord_config_id: existingConfig.id },
          { where: { id: community_id } },
        );

        return { message: 'Updated an existing discord bot config' };
      }

      await models.DiscordBotConfig.create({
        community_id,
        verification_token,
        token_expiration,
      });

      return { message: 'Created a new discord bot config' };
    },
  };
}
