import type { DB } from '@hicommonwealth/model';
import axios from 'axios';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
enum SetDiscordBotConfigErrors {
  NotAdmin = 'Not an admin',
  CommonbotConnected = 'Discord is already connected to another Commonwealth community',
  Error = 'Could not get discord bot config',
  TokenExpired = 'Token expired',
}

type GetDiscordChannelsReq = {
  chain_id: string;
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
  selectedChannel: {
    id: string;
    name: string;
  } | null;
};

const getDiscordChannels = async (
  models: DB,
  req: TypedRequestBody<GetDiscordChannelsReq>,
  res: TypedResponse<GetDiscordChannelsResp>,
) => {
  const { chain: community } = req;

  const configEntry = await models.DiscordBotConfig.findOne({
    where: {
      community_id: community.id,
    },
  });

  if (!configEntry) {
    return success(res, {
      channels: [],
      forumChannels: [],
      selectedChannel: null,
    });
  }

  const url = `https://discord.com/api/v10/guilds/${configEntry.guild_id}/channels`;

  try {
    const headers = {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
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
        selectedChannel: {
          id: configEntry.snapshot_channel_id,
          name: channels.find(
            (channel) => channel.id === configEntry.snapshot_channel_id,
          )?.name,
        },
      });
    }
  } catch (e) {
    console.log('Error getting discord channel listing', e);
  }
};

export default getDiscordChannels;
