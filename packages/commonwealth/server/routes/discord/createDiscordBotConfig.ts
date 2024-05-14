import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import type { TypedRequestBody, TypedResponse } from '../../types';
import { success } from '../../types';
import { validateOwner } from '../../util/validateOwner';

enum CreateDiscordBotConfigErrors {
  NoCommunity = 'Must supply a community ID',
  NotAdmin = 'Not an admin',
  Error = 'Could not Create discord bot config',
}

type CreateDiscordBotConfigReq = {
  community_id: string;
  verification_token: string;
};

type CreateDiscordBotConfigResp = { message: string };

const TOKEN_EXPIRATION_MINUTES = 5;

const createDiscordBotConfig = async (
  models: DB,
  req: TypedRequestBody<CreateDiscordBotConfigReq>,
  res: TypedResponse<CreateDiscordBotConfigResp>,
) => {
  const { community_id, verification_token } = req.body;

  if (!community_id || !verification_token) {
    throw new AppError(CreateDiscordBotConfigErrors.NoCommunity);
  }

  const isAdmin = await validateOwner({
    models: models,
    user: req.user,
    communityId: community_id,
    allowAdmin: true,
    allowSuperAdmin: true,
  });
  if (!isAdmin) {
    throw new AppError(CreateDiscordBotConfigErrors.NotAdmin);
  }

  const token_expiration = new Date(
    +new Date() + TOKEN_EXPIRATION_MINUTES * 60 * 1000,
  );

  try {
    // check if already exists
    const existing = await models.DiscordBotConfig.findOne({
      where: {
        community_id: community_id,
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

      return success(res, {
        message: 'updated an existing discord bot config',
      });
    } else {
      await models.DiscordBotConfig.create({
        community_id,
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
