import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import { TypedRequestBody, TypedResponse, success } from '../../types';

type RemoveDiscordBotConfigReq = {
  community_id: string;
};

type RemoveDiscordBotConfigRes = {
  message: string;
};

const removeDiscordBotConfig = async (
  models: DB,
  req: TypedRequestBody<RemoveDiscordBotConfigReq>,
  res: TypedResponse<RemoveDiscordBotConfigRes>,
) => {
  const config = await models.DiscordBotConfig.findOne({
    where: {
      community_id: req.community.id,
    },
  });

  if (!config) {
    throw new AppError('Discord config does not exist');
  }

  await models.sequelize.transaction(async (transaction) => {
    await models.Community.update(
      {
        discord_config_id: null,
        discord_bot_webhooks_enabled: false,
      },
      {
        where: {
          id: req.community.id,
        },
        transaction,
      },
    );
    await models.DiscordBotConfig.destroy({
      where: {
        community_id: req.community.id,
      },
      transaction,
    });
    await models.Topic.update(
      { channel_id: null },
      {
        where: {
          community_id: req.community.id,
        },
        transaction,
      },
    );
  });

  return success(res, {
    message: 'Successfully disconnected Discord',
  });
};

export default removeDiscordBotConfig;
