import {
  CommentDiscordActions,
  IDiscordMessage,
  ThreadDiscordActions,
  TopicAttributes,
  models,
} from '@hicommonwealth/model';
import axios from 'axios';
import { QueryTypes } from 'sequelize';
import { config } from '../config';

export async function handleThreadMessages(
  action: ThreadDiscordActions,
  message: IDiscordMessage,
  topic: TopicAttributes,
  sharedReqData: Record<string, any>,
): Promise<void> {
  switch (action) {
    case 'thread-delete':
      await axios.delete(
        `${config.SERVER_URL}/api/bot/threads/${message.message_id}`,
        { data: { ...sharedReqData } },
      );
      break;
    case 'thread-create':
      await axios.post(`${config.SERVER_URL}/api/bot/threads`, {
        ...sharedReqData,
        topic_id: topic.id,
        topic_name: topic.name,
        title: encodeURIComponent(message.title),
        body: encodeURIComponent(
          `[Go to Discord post](https://discord.com/channels/${message.guild_id}/${message.channel_id}) \n\n` +
            message.content +
            message.imageUrls.map((url) => `\n\n![image](${url})`).join(''),
        ),
        stage: 'discussion',
        kind: 'discussion',
      });
      break;
    case 'thread-title-update':
      await axios.patch(`${config.SERVER_URL}/api/bot/threads`, {
        ...sharedReqData,
        title: encodeURIComponent(message.title),
      });
      break;
    case 'thread-body-update':
      await axios.patch(`${config.SERVER_URL}/api/bot/threads`, {
        ...sharedReqData,
        body: encodeURIComponent(
          `[Go to Discord post](https://discord.com/channels/${message.guild_id}/${message.channel_id}) \n\n` +
            message.content +
            message.imageUrls.map((url) => `\n\n![image](${url})`).join(''),
        ),
      });
      break;
  }
}

export async function handleCommentMessages(
  action: CommentDiscordActions,
  message: IDiscordMessage,
  sharedReqData: Record<string, any>,
): Promise<void> {
  const [thread] = await models.sequelize.query<{ id: number }>(
    `
    SELECT id FROM "Threads" 
    WHERE discord_meta->>'message_id' = '${message.channel_id}'
    AND deleted_at IS NULL
    LIMIT 1;
`,
    { type: QueryTypes.SELECT },
  );
  if (!thread) return;

  switch (action) {
    case 'comment-create':
      await axios.post(
        `${config.SERVER_URL}/api/bot/threads/${thread.id}/comments`,
        {
          ...sharedReqData,
          text: encodeURIComponent(message.content),
        },
      );
      break;
    case 'comment-update':
      await axios.patch(
        `${config.SERVER_URL}/api/bot/threads/${thread.id}/comments`,
        {
          ...sharedReqData,
          body: encodeURIComponent(message.content),
        },
      );
      break;
    case 'comment-delete':
      await axios.delete(
        `${config.SERVER_URL}/api/bot/comments/${message.message_id}`,
        {
          data: {
            ...sharedReqData,
          },
        },
      );
      break;
  }
}
