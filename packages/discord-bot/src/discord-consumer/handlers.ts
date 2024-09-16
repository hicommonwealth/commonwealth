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

const bot_path = `${config.SERVER_URL}/api/integration/bot`;

export async function handleThreadMessages(
  action: ThreadDiscordActions,
  message: IDiscordMessage,
  topic: TopicAttributes,
  sharedReqData: Record<string, any>,
): Promise<void> {
  switch (action) {
    case 'thread-delete':
      await axios.delete(`${bot_path}/threads/${message.message_id}`, {
        data: { ...sharedReqData },
      });
      break;
    case 'thread-create':
      await axios.post(`${bot_path}/threads`, {
        ...sharedReqData,
        community_id: topic.community_id,
        topic_id: topic.id,
        // topic_name: topic.name,
        title: encodeURIComponent(message.title),
        body: encodeURIComponent(
          `[Go to Discord post](https://discord.com/channels/${message.guild_id}/${message.channel_id}) \n\n` +
            message.content +
            message.imageUrls.map((url) => `\n\n![image](${url})`).join(''),
        ),
        stage: 'discussion',
        kind: 'discussion',
        read_only: false,
        canvas_signed_data: '',
        canvas_hash: '',
      });
      break;
    case 'thread-title-update':
      await axios.patch(`${bot_path}/threads`, {
        ...sharedReqData,
        thread_id: 0, // required in command
        community_id: topic.community_id, // to auth command
        title: encodeURIComponent(message.title),
      });
      break;
    case 'thread-body-update':
      await axios.patch(`${bot_path}/threads`, {
        ...sharedReqData,
        thread_id: 0, // required in command
        community_id: topic.community_id, // to auth command
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
      await axios.post(`${bot_path}/threads/${thread.id}/comments`, {
        ...sharedReqData,
        thread_id: thread.id,
        text: encodeURIComponent(message.content),
      });
      break;
    case 'comment-update':
      await axios.patch(`${bot_path}/threads/${thread.id}/comments`, {
        ...sharedReqData,
        comment_id: 0, // required in command
        thread_id: thread.id, // to auth command
        text: encodeURIComponent(message.content),
      });
      break;
    case 'comment-delete':
      await axios.delete(`${bot_path}/comments/${message.message_id}`, {
        data: {
          ...sharedReqData,
          comment_id: 0, // required in command
          thread_id: thread.id, // to auth command
          message_id: message.message_id,
        },
      });
      break;
  }
}
