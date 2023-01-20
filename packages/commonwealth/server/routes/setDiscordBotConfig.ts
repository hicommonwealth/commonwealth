import { AppError } from 'common-common/src/errors';
import validateChain from '../middleware/validateChain';
import type { DB } from '../models';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

enum SetDiscordBotConfigErrors {
  NoChain = 'Must supply a chain ID',
  NotAdmin = 'Not an admin',
  CommonbotConnected = 'Discord is already connected to another Commonwealth community',
  Error = 'Could not set discord bot config',
  TokenExpired = 'Token expired',
}

type SetDiscordBotConfigReq = {
  chain_id: string;
  bot_id?: string;
  guild_id?: string;
  verification_token?: string;
  snapshot_channel_id?: string;
};

type SetDiscordBotConfigResp = {
  message: string;
};

const setDiscordBotConfig = async (
  models: DB,
  req: TypedRequestBody<SetDiscordBotConfigReq>,
  res: TypedResponse<SetDiscordBotConfigResp>
) => {
  const {
    chain_id,
    bot_id,
    guild_id,
    verification_token,
    snapshot_channel_id,
  } = req.body;

  const [error] = await validateChain(models, { chain_id });
  if (!chain_id || error) throw new AppError(SetDiscordBotConfigErrors.NoChain);

  if (snapshot_channel_id) {
    // An update that comes from CW, not the bot. Handle accordingly
    const configEntry = await models.DiscordBotConfig.findOne({
      where: {
        chain_id,
      },
    });
    configEntry.snapshot_channel_id =
      snapshot_channel_id !== 'disabled' ? snapshot_channel_id : null;
    await configEntry.save();
    return success(res, {
      message: 'Updated channel id',
    });
  }

  const configEntry = await models.DiscordBotConfig.findOne({
    where: {
      chain_id,
      verification_token,
    },
  });

  if (!configEntry || chain_id !== configEntry.chain_id) {
    throw new AppError(SetDiscordBotConfigErrors.NotAdmin);
  }

  if (configEntry.token_expiration < new Date()) {
    throw new AppError(SetDiscordBotConfigErrors.TokenExpired);
  }

  const existingCommunityWithGuildConnected =
    await models.DiscordBotConfig.findAll({ where: { guild_id } });

  const chainInstance = await models.Chain.findOne({
    where: { id: chain_id },
  });

  if (
    existingCommunityWithGuildConnected &&
    existingCommunityWithGuildConnected.length > 0
  ) {
    // Handle discord already linked to another CW community
    try {
      chainInstance.discord_config_id = null;
      await chainInstance.save();

      await models.DiscordBotConfig.destroy({
        where: {
          chain_id,
        },
      });
      console.log(
        'Attempted to add a guild that was already connected to another CW community.'
      );
    } catch (e) {
      console.log(e);
    }

    throw new AppError(SetDiscordBotConfigErrors.CommonbotConnected);
  } else {
    try {
      chainInstance.discord_config_id = configEntry.id;
      await chainInstance.save();
    } catch (e) {
      console.log(e);
    }
  }

  try {
    await configEntry.update(
      {
        chain_id,
        bot_id,
        guild_id,
        verification_token: null,
        token_expiration: null,
        verified: true,
      },
      {
        where: {
          guild_id,
        },
      }
    );

    return success(res, {
      message: 'created a new discord bot config',
    });
  } catch (e) {
    console.log(e);
    throw new AppError(SetDiscordBotConfigErrors.Error);
  }
};

export default setDiscordBotConfig;
