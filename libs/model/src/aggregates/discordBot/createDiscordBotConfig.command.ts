import { type Command, InvalidState } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { canIntegrateDiscord, CommunityTierMap } from '@hicommonwealth/shared';
import { models } from '../../database';
import { authRoles } from '../../middleware';

const TOKEN_EXPIRATION_MINUTES = 5;

export function CreateDiscordBotConfig(): Command<
  typeof schemas.CreateDiscordBotConfig
> {
  return {
    ...schemas.CreateDiscordBotConfig,
    auth: [authRoles('admin')],
    secure: true,
    body: async ({ payload }) => {
      const { community_id, verification_token } = payload;
      const token_expiration = new Date(
        +new Date() + TOKEN_EXPIRATION_MINUTES * 60 * 1000,
      );

      const community = await models.Community.findOne({
        attributes: ['tier'],
        where: {
          id: community_id,
        },
      });
      if (!community) {
        throw new InvalidState('Community not found');
      }

      if (!canIntegrateDiscord(community)) {
        throw new InvalidState(
          `Community tier must be at least ${CommunityTierMap.ManuallyVerified}`,
        );
      }

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
