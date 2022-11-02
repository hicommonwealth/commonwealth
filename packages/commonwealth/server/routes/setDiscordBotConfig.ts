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
  Error = 'Could not set discord bot config',
}

type SetDiscordBotConfigReq = {
  chain_id: string;
  bot_id: string;
  guild_id: string;
};

type SetDiscordBotConfigResp = {
  message: string;
};

const setDiscordBotConfig = async (
  models: DB,
  req: TypedRequestBody<SetDiscordBotConfigReq>,
  res: TypedResponse<SetDiscordBotConfigResp>
) => {
  const { chain_id, bot_id, guild_id } = req.body;
  console.log('req.query', req.body);
  console.log('chain id', chain_id);

  const [chain, error] = await validateChain(models, { chain_id });
  console.log('error', error);
  if (!chain_id || error) throw new AppError(SetDiscordBotConfigErrors.NoChain);

  // TODO: admin check

  try {
    // check if already exists
    const existing = await models.DiscordBotConfig.findOne({
      where: {
        guild_id,
      },
    });

    if (existing) {
      const existingConfig = await existing.update(
        {
          chain_id,
          bot_id,
          guild_id,
        },
        {
          where: {
            guild_id,
          },
        }
      );

      await models.Chain.update(
        { discord_config_id: existingConfig.id },
        { where: { id: chain_id } }
      );

      return success(res, {
        message: 'updated an existing discord bot config',
      });
    } else {
      const newConfig = await models.DiscordBotConfig.create({
        chain_id,
        bot_id,
        guild_id,
      });

      await models.Chain.update(
        { discord_config_id: newConfig.id },
        { where: { id: chain_id } }
      );

      return success(res, {
        message: 'created a new discord bot config',
      });
    }
  } catch (e) {
    console.log(e);
    throw new AppError(SetDiscordBotConfigErrors.Error);
  }
};

export default setDiscordBotConfig;
