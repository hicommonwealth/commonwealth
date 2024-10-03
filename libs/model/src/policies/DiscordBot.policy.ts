import { Actor, Policy, command, events } from '@hicommonwealth/core';
import { DISCORD_BOT_ADDRESS, DISCORD_BOT_EMAIL } from '@hicommonwealth/shared';
import { z } from 'zod';
import { CreateComment, DeleteComment, UpdateComment } from '../comment';
import { models } from '../database';
import { CreateThread, DeleteThread, UpdateThread } from '../thread';

const ThreadEventInputs = {
  DiscordThreadBodyUpdated: events.DiscordThreadBodyUpdated,
  DiscordThreadTitleUpdated: events.DiscordThreadTitleUpdated,
  DiscordThreadDeleted: events.DiscordThreadDeleted,
};

const CommentEventInputs = {
  DiscordThreadCommentUpdated: events.DiscordThreadCommentUpdated,
  DiscordThreadCommentDeleted: events.DiscordThreadCommentDeleted,
};

const inputs = {
  ...ThreadEventInputs,
  ...CommentEventInputs,
  DiscordThreadCreated: events.DiscordThreadCreated,
  DiscordThreadCommentCreated: events.DiscordThreadCommentCreated,
};

let actor: Actor;

async function getActor() {
  if (actor) return actor;

  const userInstance = await models.User.findOne({
    where: { email: DISCORD_BOT_EMAIL },
  });
  if (!userInstance) throw new Error('DiscordBot user not found!');

  actor = {
    user: {
      id: userInstance.id!,
      email: userInstance.email!,
      isAdmin: userInstance.isAdmin!,
    },
    address: DISCORD_BOT_ADDRESS,
  };
  return actor;
}

async function getThread(
  payload: z.infer<(typeof ThreadEventInputs)[keyof typeof ThreadEventInputs]>,
) {
  return await models.Thread.findOne({
    attributes: ['id'],
    where: {
      discord_meta: {
        message_id: payload.message_id,
      },
    },
    logging: console.log,
  });
}

async function getComment(
  payload: z.infer<
    (typeof CommentEventInputs)[keyof typeof CommentEventInputs]
  >,
) {
  return await models.Comment.findOne({
    attributes: ['id'],
    where: {
      discord_meta: { message_id: payload.message_id },
    },
  });
}

export function DiscordBotPolicy(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      DiscordThreadCreated: async ({ payload }) => {
        const topic = await models.Topic.findOne({
          where: {
            channel_id: payload.parent_channel_id,
          },
        });
        if (!topic) return;

        await command(CreateThread(), {
          actor: await getActor(),
          payload: {
            community_id: topic.community_id,
            topic_id: topic.id!,
            title: payload.title,
            body:
              '[Go to Discord post](https://discord.com/channels/' +
              `${payload.guild_id}/${payload.channel_id}) \n\n` +
              payload.content +
              payload.imageUrls.map((url) => `\n\n![image](${url})`).join(''),
            stage: 'discussion',
            kind: 'discussion',
            read_only: false,
            discord_meta: {
              user: {
                id: payload.user.id,
                username: payload.user.username,
              },
              channel_id: payload.parent_channel_id,
              message_id: payload.message_id,
            },
          },
        });
      },
      DiscordThreadBodyUpdated: async ({ payload }) => {
        const thread = await getThread(payload);
        if (!thread) {
          return;
        }

        await command(UpdateThread(), {
          actor: await getActor(),
          payload: {
            thread_id: thread.id!,
            body:
              '[Go to Discord post](https://discord.com/channels/' +
              `${payload.guild_id}/${payload.channel_id}) \n\n` +
              payload.content +
              payload.imageUrls.map((url) => `\n\n![image](${url})`).join(''),
          },
        });
      },
      DiscordThreadTitleUpdated: async ({ payload }) => {
        const thread = await getThread(payload);
        if (!thread) {
          return;
        }

        await command(UpdateThread(), {
          actor: await getActor(),
          payload: {
            thread_id: thread.id!,
            title: payload.title,
          },
        });
      },
      DiscordThreadDeleted: async ({ payload }) => {
        const thread = await getThread(payload);
        if (!thread) {
          return;
        }

        await command(DeleteThread(), {
          actor: await getActor(),
          payload: {
            thread_id: thread.id!,
          },
        });
      },
      DiscordThreadCommentCreated: async ({ payload }) => {
        // don't use getThread because this is a special case
        // thread_id = channel_id instead of message_id
        const thread = await models.Thread.findOne({
          attributes: ['id'],
          where: {
            discord_meta: {
              message_id: payload.channel_id,
            },
          },
        });
        if (!thread) {
          return;
        }

        await command(CreateComment(), {
          actor: await getActor(),
          payload: {
            thread_id: thread.id!,
            text: payload.content,
            discord_meta: {
              user: {
                id: payload.user.id,
                username: payload.user.username,
              },
              channel_id: payload.parent_channel_id,
              message_id: payload.message_id,
            },
          },
        });
      },
      DiscordThreadCommentUpdated: async ({ payload }) => {
        const comment = await getComment(payload);
        if (!comment) return;

        await command(UpdateComment(), {
          actor: await getActor(),
          payload: {
            comment_id: comment.id!,
            text: payload.content,
          },
        });
      },
      DiscordThreadCommentDeleted: async ({ payload }) => {
        const comment = await getComment(payload);
        if (!comment) return;

        await command(DeleteComment(), {
          actor: await getActor(),
          payload: {
            comment_id: comment.id!,
          },
        });
      },
    },
  };
}
