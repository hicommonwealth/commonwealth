import {
  InvalidInput,
  InvalidState,
  logger,
  type Command,
} from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { DISCORD_BOT_ADDRESS, DISCORD_BOT_EMAIL } from '@hicommonwealth/shared';
import { models } from '../database';
import { authRoles } from '../middleware';

const log = logger(import.meta);

const Errors = {
  ConfigNotFound: 'Config not found',
  TokenExpirationNotSet: 'Token expiration not set',
  TokenExpired: 'Verification token expired',
  CommunityNotFound: 'Community not found',
  AlreadyConnected: 'Discord server is already connected to another community',
};

export function SetDiscordBotConfig(): Command<
  typeof schemas.SetDiscordBotConfig
> {
  return {
    ...schemas.SetDiscordBotConfig,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const { community_id, guild_id, verification_token } = payload;

      const configEntry = await models.DiscordBotConfig.findOne({
        where: {
          community_id,
          verification_token,
        },
      });

      if (!configEntry) throw new InvalidInput(Errors.ConfigNotFound);
      if (!configEntry.token_expiration)
        throw new InvalidState(Errors.TokenExpirationNotSet);
      if (configEntry.token_expiration < new Date())
        throw new InvalidInput(Errors.TokenExpired);

      const existingCommunityWithGuildConnected =
        await models.DiscordBotConfig.findAll({ where: { guild_id } });

      const communityInstance = await models.Community.findOne({
        where: { id: community_id },
      });
      if (!communityInstance) throw new InvalidState(Errors.CommunityNotFound);

      if (
        existingCommunityWithGuildConnected &&
        existingCommunityWithGuildConnected.length > 0
      ) {
        await models.sequelize.transaction(async (transaction) => {
          // Handle discord already linked to another CW community
          communityInstance.discord_config_id = null;
          await communityInstance.save({ transaction });

          await models.DiscordBotConfig.destroy({
            where: {
              community_id,
            },
            transaction,
          });
        });

        log.info(
          'Attempted to add a guild that was already connected to another CW community.',
        );
        throw new InvalidInput(Errors.AlreadyConnected);
      }

      await models.sequelize.transaction(async (transaction) => {
        const user = await models.User.findOne({
          where: { email: DISCORD_BOT_EMAIL },
        });
        let created = false;
        let address = await models.Address.findOne({
          where: {
            user_id: user?.id,
            address: DISCORD_BOT_ADDRESS,
            community_id,
          },
          transaction,
        });
        if (!address) {
          created = true;
          address = await models.Address.create(
            {
              user_id: user?.id,
              address: DISCORD_BOT_ADDRESS,
              community_id,
              role: 'admin',
              verification_token: '123456',
              verification_token_expires: new Date(2030, 1, 1),
              verified: new Date(),
              last_active: new Date(),
              ghost_address: false,
              is_user_default: false,
              is_banned: false,
            },
            { transaction },
          );
        }

        if (!created && address.role !== 'admin') {
          address.role = 'admin';
          await address.save({ transaction });
        }

        communityInstance.discord_config_id = configEntry.id;
        await communityInstance.save({ transaction });

        await configEntry.update(
          {
            community_id,
            guild_id,
            verification_token: null,
            token_expiration: null,
            verified: true,
          },
          {
            where: {
              guild_id,
            },
            transaction,
          },
        );
      });

      return {
        message: 'Created a new discord bot config',
        discordConfigId: communityInstance.discord_config_id,
      };
    },
  };
}
