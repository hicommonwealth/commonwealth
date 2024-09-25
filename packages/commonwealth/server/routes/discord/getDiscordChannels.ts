import type { DB } from '@hicommonwealth/model';
import axios from 'axios';
import { config } from '../../config';
import type { TypedRequestBody, TypedResponse } from '../../types';
import { success } from '../../types';

type GetDiscordChannelsReq = {
  community_id: string;
};

type GetDiscordChannelsResp = {
  channels: {
    id: string;
    name: string;
  }[];
  forumChannels: {
    id: string;
    name: string;
  }[];
};

const getDiscordChannels = async (
  models: DB,
  req: TypedRequestBody<GetDiscordChannelsReq>,
  res: TypedResponse<GetDiscordChannelsResp>,
) => {
  const { community } = req;

  const configEntry = await models.DiscordBotConfig.findOne({
    where: {
      community_id: community!.id!,
    },
  });

  if (!configEntry) {
    return success(res, {
      channels: [],
      forumChannels: [],
    });
  }

  const url = `https://discord.com/api/v10/guilds/${configEntry.guild_id}/channels`;

  const headers = {
    Authorization: `Bot ${config.DISCORD.BOT_TOKEN}`,
  };
  const response = await axios.get(url, { headers });

  if (response.status === 200) {
    const channels = response.data;

    return success(res, {
      channels: channels
        .filter((channel) => {
          return channel.type === 0; // Only Text Channels
        })
        .map((channel) => {
          return { id: channel.id, name: channel.name };
        }),
      forumChannels: channels
        .filter((channel) => {
          return channel.type === 15; // Only forum channels
        })
        .map((channel) => {
          return { id: channel.id, name: channel.name };
        }),
    });
  }
};

export default getDiscordChannels;
