import { events, Policy } from '@hicommonwealth/core';
import { DISCORD_BOT_ADDRESS } from '@hicommonwealth/shared';
import axios from 'axios';
import { z } from 'zod';
import { config } from '../config';
import { models } from '../database';

const inputs = {
  DiscordThreadCreated: events.DiscordThreadCreated,
  DiscordThreadBodyUpdated: events.DiscordThreadBodyUpdated,
  DiscordThreadTitleUpdated: events.DiscordThreadTitleUpdated,
  DiscordThreadDeleted: events.DiscordThreadDeleted,
  DiscordThreadCommentCreated: events.DiscordThreadCommentCreated,
  DiscordThreadCommentUpdated: events.DiscordThreadCommentUpdated,
  DiscordThreadCommentDeleted: events.DiscordThreadCommentDeleted,
};

type InputWOThreadDelete = Omit<
  typeof inputs,
  'DiscordThreadDeleted'
>[keyof Omit<typeof inputs, 'DiscordThreadDeleted'>];

function getSharedData(payload: z.infer<InputWOThreadDelete>) {
  return {
    auth: config.DISCORD.BOT_KEY,
    address: DISCORD_BOT_ADDRESS,
    discord_meta: {
      message_id: payload.message_id,
      channel_id: payload.parent_channel_id,
      user: payload.user,
    },
  };
}

const bot_path = `${config.SERVER_URL}/api/integration/bot`;

export function DiscordBot(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      DiscordThreadCreated: async ({ payload }) => {
        const topic = await models.Topic.findOne({
          where: {
            id: payload.parent_channel_id,
          },
        });
        if (!topic) return;

        await axios.post(`${bot_path}/threads`, {
          ...getSharedData(payload),
          community_id: topic.community_id,
          topic_id: topic.id,
          title: payload.title,
          body:
            `[Go to Discord post](https://discord.com/channels/${payload.guild_id}/${payload.channel_id}) \n\n` +
            payload.content +
            payload.imageUrls.map((url) => `\n\n![image](${url})`).join(''),
          stage: 'discussion',
          kind: 'discussion',
          read_only: false,
        });
      },
      DiscordThreadBodyUpdated: async ({ payload }) => {
        await axios.patch(`${bot_path}/threads/${payload.message_id}`, {
          ...getSharedData(payload),
          body:
            '[Go to Discord post](https://discord.com/channels/' +
            `${payload.guild_id}/${payload.channel_id}) \n\n` +
            payload.content +
            payload.imageUrls.map((url) => `\n\n![image](${url})`).join(''),
        });
      },
      DiscordThreadTitleUpdated: async ({ payload }) => {
        await axios.patch(`${bot_path}/threads/${payload.message_id}`, {
          ...getSharedData(payload),
          title: payload.title,
        });
      },
      DiscordThreadDeleted: async ({ payload }) => {
        await axios.delete(`${bot_path}/threads/${payload.message_id}`, {
          data: {
            auth: config.DISCORD.BOT_KEY,
            address: DISCORD_BOT_ADDRESS,
            discord_meta: {
              message_id: payload.message_id,
              channel_id: payload.parent_channel_id,
            },
          },
        });
      },
      DiscordThreadCommentCreated: async ({ payload }) => {
        await axios.post(`${bot_path}/threads/${payload.channel_id}/comments`, {
          ...getSharedData(payload),
          text: payload.content,
        });
      },
      DiscordThreadCommentUpdated: async ({ payload }) => {
        await axios.patch(`${bot_path}/comments/${payload.message_id}`, {
          ...getSharedData(payload),
          text: payload.content,
        });
      },
      DiscordThreadCommentDeleted: async ({ payload }) => {
        await axios.delete(`${bot_path}/comments/${payload.message_id}`, {
          data: getSharedData(payload),
        });
      },
    },
  };
}
