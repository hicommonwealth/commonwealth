import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import axios from 'axios';
import { config } from '../config';
import { models } from '../database';
import { AuthContext, isAuthorized } from '../middleware';

export function GetDiscordChannels(): Query<
  typeof schemas.GetDiscordChannels,
  AuthContext
> {
  return {
    ...schemas.GetDiscordChannels,
    auth: [isAuthorized({ roles: ['admin'] })],
    body: async ({ payload }) => {
      const configEntry = await models.DiscordBotConfig.findOne({
        where: {
          community_id: payload.community_id,
        },
      });

      if (!configEntry)
        return {
          channels: [],
          forumChannels: [],
        };

      const url = `https://discord.com/api/v10/guilds/${configEntry.guild_id}/channels`;
      const headers = {
        Authorization: `Bot ${config.DISCORD.BOT_TOKEN}`,
      };
      const response = await axios.get(url, { headers });

      if (response.status === 200) {
        const channels: { id: string; name: string; type: number }[] =
          response.data;

        return {
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
        };
      }
    },
  };
}
