import { AppError, logger } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import { DISCORD_BOT_ADDRESS, DISCORD_BOT_EMAIL } from '@hicommonwealth/shared';
import { fileURLToPath } from 'url';
import { validateCommunity } from '../../middleware/validateCommunity';
import type { TypedRequestBody, TypedResponse } from '../../types';
import { success } from '../../types';
import { validateOwner } from '../../util/validateOwner';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

enum SetDiscordBotConfigErrors {
  NoCommunity = 'Must supply a community ID',
  NotAdmin = 'Not an admin',
  CommonbotConnected = 'Discord server is already connected to another Commonwealth community',
  Error = 'Could not set discord bot config',
  TokenExpired = 'Token expired',
}

type SetDiscordBotConfigReq = {
  community_id: string;
  guild_id?: string;
  verification_token?: string;
  snapshot_channel_id?: string;
};

type SetDiscordBotConfigResp = {
  message: string;
  discordConfigId: number;
};

const setDiscordBotConfig = async (
  models: DB,
  req: TypedRequestBody<SetDiscordBotConfigReq>,
  res: TypedResponse<SetDiscordBotConfigResp>,
) => {
  const { community_id, guild_id, verification_token, snapshot_channel_id } =
    req.body;

  const isAdmin = await validateOwner({
    models: models,
    // @ts-expect-error StrictNullChecks
    user: req.user,
    communityId: community_id,
    allowAdmin: true,
    allowSuperAdmin: true,
  });
  if (!isAdmin) {
    throw new AppError(SetDiscordBotConfigErrors.NotAdmin);
  }

  const [community, error] = await validateCommunity(models, { community_id });
  if (!community || error)
    throw new AppError(SetDiscordBotConfigErrors.NoCommunity);

  if (snapshot_channel_id) {
    // An update that comes from CW, not the bot. Handle accordingly
    const configEntry = await models.DiscordBotConfig.findOne({
      where: {
        community_id,
      },
    });
    // @ts-expect-error StrictNullChecks
    configEntry.snapshot_channel_id =
      snapshot_channel_id !== 'disabled' ? snapshot_channel_id : null;
    // @ts-expect-error StrictNullChecks
    await configEntry.save();
    return success(res, {
      message: 'Updated channel id',
      discordConfigId: community.discord_config_id,
    });
  }

  const configEntry = await models.DiscordBotConfig.findOne({
    where: {
      community_id,
      verification_token,
    },
  });

  if (!configEntry) {
    throw new AppError(SetDiscordBotConfigErrors.NotAdmin);
  }

  if (configEntry.token_expiration < new Date()) {
    throw new AppError(SetDiscordBotConfigErrors.TokenExpired);
  }

  const existingCommunityWithGuildConnected =
    await models.DiscordBotConfig.findAll({ where: { guild_id } });

  const communityInstance = await models.Community.findOne({
    where: { id: community_id },
  });

  if (
    existingCommunityWithGuildConnected &&
    existingCommunityWithGuildConnected.length > 0
  ) {
    await models.sequelize.transaction(async (transaction) => {
      // Handle discord already linked to another CW community
      // @ts-expect-error StrictNullChecks
      communityInstance.discord_config_id = null;
      // @ts-expect-error StrictNullChecks
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

    throw new AppError(SetDiscordBotConfigErrors.CommonbotConnected);
  }

  await models.sequelize.transaction(async (transaction) => {
    const user = await models.User.findOne({
      where: { email: DISCORD_BOT_EMAIL },
    });
    const [address, created] = await models.Address.findOrCreate({
      where: {
        user_id: user?.id,
        address: DISCORD_BOT_ADDRESS,
        community_id,
      },
      // @ts-expect-error StrictNullChecks
      defaults: {
        role: 'admin',
        verification_token: '123456',
        verification_token_expires: new Date(2030, 1, 1),
        verified: new Date(),
        last_active: new Date(),
      },
      transaction,
    });

    if (!created && address.role !== 'admin') {
      address.role = 'admin';
      await address.save({ transaction });
    }

    // @ts-expect-error StrictNullChecks
    communityInstance.discord_config_id = configEntry.id;
    // @ts-expect-error StrictNullChecks
    await communityInstance.save({ transaction });

    await configEntry.update(
      // @ts-expect-error StrictNullChecks
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

  return success(res, {
    message: 'created a new discord bot config',
    // @ts-expect-error StrictNullChecks
    discordConfigId: communityInstance.discord_config_id,
  });
};

export default setDiscordBotConfig;
