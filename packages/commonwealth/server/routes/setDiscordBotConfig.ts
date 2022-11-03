import { AppError } from '../util/errors';
import {
  success,
  TypedRequestBody,
  TypedRequestQuery,
  TypedResponse,
} from '../types';
import { DB } from '../models';
import validateChain from '../util/validateChain';
import validateRoles from '../util/validateRoles';
import { BanAttributes } from '../models/ban';

enum SetDiscordBotConfigErrors {
  NoChain = 'Must supply a chain ID',
  NotAdmin = 'Not an admin',
  CommonbotConnected = 'Discord is already connected to another Commonwealth community',
  Error = 'Could not set discord bot config',
  TokenExpired = 'Token expired',
}

type SetDiscordBotConfigReq = {
  chain_id: string;
  bot_id: string;
  guild_id: string;
  verification_token: string;
};

type SetDiscordBotConfigResp = {
  message: string;
};

const setDiscordBotConfig = async (
  models: DB,
  req: TypedRequestBody<SetDiscordBotConfigReq>,
  res: TypedResponse<SetDiscordBotConfigResp>
) => {
  const { chain_id, bot_id, guild_id, verification_token } = req.body;

  const [chain, error] = await validateChain(models, { chain_id });
  if (!chain_id || error) throw new AppError(SetDiscordBotConfigErrors.NoChain);

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

  if (
    existingCommunityWithGuildConnected &&
    existingCommunityWithGuildConnected.length > 0
  ) {
    // Handle discord already linked to another CW community
    try {
      const chainInstance = await models.Chain.findOne({
        where: { id: chain_id },
      });

      chainInstance.discord_config_id = null;
      await chainInstance.save();

      await models.DiscordBotConfig.destroy({
        where: {
          chain_id,
        },
      });
    } catch (e) {
      console.log(e);
    }

    throw new AppError(SetDiscordBotConfigErrors.CommonbotConnected);
  }

  try {
    const updatedConfig = await configEntry.update(
      {
        chain_id,
        bot_id,
        guild_id,
        verification_token: null,
        token_expiration: null,
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
