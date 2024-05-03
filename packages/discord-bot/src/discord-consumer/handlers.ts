import { TopicAttributes } from '@hicommonwealth/model';
import {
  CommentDiscordActions,
  IDiscordMessage,
  ThreadDiscordActions,
} from '@hicommonwealth/shared';
import axios from 'axios';
import { SERVER_URL } from '../utils/config';
import { sequelize } from '../utils/database';

export async function handleThreadMessages(
  action: ThreadDiscordActions,
  message: IDiscordMessage,
  topic: TopicAttributes,
  sharedReqData: Record<string, any>,
): Promise<void> {
  switch (action) {
    case 'thread-delete':
      await axios.delete(
        `${SERVER_URL}/api/bot/threads/${message.message_id}`,
        { data: { ...sharedReqData } },
      );
      break;
    case 'thread-create':
      await axios.post(`${SERVER_URL}/api/bot/threads`, {
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
      await axios.patch(`${SERVER_URL}/api/bot/threads`, {
        ...sharedReqData,
        title: encodeURIComponent(message.title),
      });
      break;
    case 'thread-body-update':
      await axios.patch(`${SERVER_URL}/api/bot/threads`, {
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
  const threadId: { id: number } = (
    await sequelize.query(`
        SELECT id FROM "Threads" 
        WHERE discord_meta->>'message_id' = '${message.channel_id}'
        AND deleted_at IS NULL
        LIMIT 1;
    `)
  )[0][0]['id'];

  switch (action) {
    case 'comment-create':
      await axios.post(`${SERVER_URL}/api/bot/threads/${threadId}/comments`, {
        ...sharedReqData,
        text: encodeURIComponent(message.content),
      });
      break;
    case 'comment-update':
      await axios.patch(`${SERVER_URL}/api/bot/threads/${threadId}/comments`, {
        ...sharedReqData,
        body: encodeURIComponent(message.content),
      });
      break;
    case 'comment-delete':
      await axios.delete(
        `${SERVER_URL}/api/bot/comments/${message.message_id}`,
        {
          data: {
            ...sharedReqData,
          },
        },
      );
      break;
  }
}
