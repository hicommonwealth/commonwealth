import { AppError } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import type { DB } from '@hicommonwealth/model';
import { fileURLToPath } from 'node:url';
import { validateCommunity } from '../middleware/validateCommunity';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import { validateOwner } from '../util/validateOwner';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

enum SetDiscordBotConfigErrors {
  NoCommunity = 'Must supply a community ID',
  NotAdmin = 'Not an admin',
  CommonbotConnected = 'Discord is already connected to another Commonwealth community',
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
    configEntry.snapshot_channel_id =
      snapshot_channel_id !== 'disabled' ? snapshot_channel_id : null;
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

  if (!configEntry || community_id !== configEntry.community_id) {
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
    // Handle discord already linked to another CW community
    communityInstance.discord_config_id = null;
    await communityInstance.save();

    await models.DiscordBotConfig.destroy({
      where: {
        community_id,
      },
    });
    log.info(
      'Attempted to add a guild that was already connected to another CW community.',
    );

    throw new AppError(SetDiscordBotConfigErrors.CommonbotConnected);
  } else {
    const profile = await models.Profile.findOne({
      where: {
        profile_name: 'Discord Bot',
      },
    });

    const [address, created] = await models.Address.findOrCreate({
      where: {
        user_id: profile.user_id,
        profile_id: profile.id,
        address: '0xdiscordbot',
        community_id,
      },
      defaults: {
        role: 'admin',
        verification_token: '123456',
        verification_token_expires: new Date(2030, 1, 1),
        verified: new Date(),
        last_active: new Date(),
      },
    });

    if (!created && address.role !== 'admin') {
      address.role = 'admin';
      await address.save();
    }

    communityInstance.discord_config_id = configEntry.id;
    await communityInstance.save();
  }

  try {
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
      },
    );

    return success(res, {
      message: 'created a new discord bot config',
      discordConfigId: communityInstance.discord_config_id,
    });
  } catch (e) {
    console.log(e);
    throw new AppError(SetDiscordBotConfigErrors.Error);
  }
};

export default setDiscordBotConfig;
