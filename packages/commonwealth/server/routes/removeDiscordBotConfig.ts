import type { DB } from '@hicommonwealth/model';
import { TypedRequestBody, TypedResponse } from '../types';

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
    throw new Error('');
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
};

export default removeDiscordBotConfig;
