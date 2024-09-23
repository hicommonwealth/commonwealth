import {
  CommentDiscordActions,
  IDiscordMessage,
  ThreadDiscordActions,
  TopicAttributes,
} from '@hicommonwealth/model';
import axios from 'axios';
import { config } from '../config';

const bot_path = `${config.SERVER_URL}/api/integration/bot`;

export async function handleThreadMessages(
  action: ThreadDiscordActions,
  message: IDiscordMessage,
  topic: TopicAttributes,
  sharedReqData: Record<string, any>,
): Promise<void> {
  switch (action) {
    case 'thread-create':
      await axios.post(`${bot_path}/threads`, {
        ...sharedReqData,
        community_id: topic.community_id,
        topic_id: topic.id,
        title: encodeURIComponent(message.title),
        body: encodeURIComponent(
          `[Go to Discord post](https://discord.com/channels/${message.guild_id}/${message.channel_id}) \n\n` +
            message.content +
            message.imageUrls.map((url) => `\n\n![image](${url})`).join(''),
        ),
        stage: 'discussion',
        kind: 'discussion',
        read_only: false,
      });
      break;

    case 'thread-title-update':
      await axios.patch(`${bot_path}/threads/${message.message_id}`, {
        ...sharedReqData,
        title: encodeURIComponent(message.title),
      });
      break;

    case 'thread-body-update':
      await axios.patch(`${bot_path}/threads/${message.message_id}`, {
        ...sharedReqData,
        body: encodeURIComponent(
          `[Go to Discord post](https://discord.com/channels/${message.guild_id}/${message.channel_id}) \n\n` +
            message.content +
            message.imageUrls.map((url) => `\n\n![image](${url})`).join(''),
        ),
      });
      break;

    case 'thread-delete':
      await axios.delete(`${bot_path}/threads/${message.message_id}`, {
        data: sharedReqData,
      });
      break;
  }
}

export async function handleCommentMessages(
  action: CommentDiscordActions,
  message: IDiscordMessage,
  sharedReqData: Record<string, any>,
): Promise<void> {
  switch (action) {
    case 'comment-create':
      await axios.post(`${bot_path}/threads/${message.channel_id}/comments`, {
        ...sharedReqData,
        text: encodeURIComponent(message.content),
      });
      break;

    case 'comment-update':
      await axios.patch(`${bot_path}/comments/${message.message_id}`, {
        ...sharedReqData,
        text: encodeURIComponent(message.content),
      });
      break;

    case 'comment-delete':
      await axios.delete(`${bot_path}/comments/${message.message_id}`, {
        data: sharedReqData,
      });
      break;
  }
}
