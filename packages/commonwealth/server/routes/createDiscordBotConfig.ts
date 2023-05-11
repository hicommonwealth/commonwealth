import { AppError } from 'common-common/src/errors';
import type { DB } from '../models';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import validateRoles from '../util/validateRoles';

enum CreateDiscordBotConfigErrors {
  NoChain = 'Must supply a chain ID',
  NotAdmin = 'Not an admin',
  Error = 'Could not Create discord bot config',
}

type CreateDiscordBotConfigReq = {
  chain_id: string;
  verification_token: string;
};

type CreateDiscordBotConfigResp = { message: string };

const TOKEN_EXPIRATION_MINUTES = 5;

const createDiscordBotConfig = async (
  models: DB,
  req: TypedRequestBody<CreateDiscordBotConfigReq>,
  res: TypedResponse<CreateDiscordBotConfigResp>
) => {
  const { chain_id, verification_token } = req.body;

  if (!chain_id || !verification_token)
    throw new AppError(CreateDiscordBotConfigErrors.NoChain);

  if (!req.user || !validateRoles(models, req.user, 'admin', chain_id)) {
    throw new AppError(CreateDiscordBotConfigErrors.NotAdmin);
  }

  const token_expiration = new Date(
    +new Date() + TOKEN_EXPIRATION_MINUTES * 60 * 1000
  );

  try {
    // check if already exists
    const existing = await models.DiscordBotConfig.findOne({
      where: {
        chain_id,
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
            chain_id,
          },
        }
      );

      await models.Community.update(
        { discord_config_id: existingConfig.id },
        { where: { id: chain_id } }
      );

      return success(res, {
        message: 'updated an existing discord bot config',
      });
    } else {
      await models.DiscordBotConfig.create({
        chain_id,
        verification_token,
        token_expiration,
      });

      return success(res, {
        message: 'created a new discord bot config',
      });
    }
  } catch (e) {
    console.log(e);
    throw new AppError(CreateDiscordBotConfigErrors.Error);
  }
};

export default createDiscordBotConfig;
