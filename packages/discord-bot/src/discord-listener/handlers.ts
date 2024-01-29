import {
  RabbitMQController,
  RascalPublications,
} from '@hicommonwealth/adapters';
import { DiscordAction, IDiscordMessage, logger } from '@hicommonwealth/core';
import { Client, Message, ThreadChannel } from 'discord.js';
import { getImageUrls } from '../discord-listener/util';
import { getForumLinkedTopic } from '../utils/util';

const log = logger().getLogger(__filename);

export async function handleMessage(
  controller: RabbitMQController,
  client: Client,
  message: Partial<Message>,
  action: DiscordAction,
) {
  log.info(
    `Discord message received from channel ID: ${message.channelId} with action: ${action}`,
  );
  try {
    // 1. Filter for designated forum channels
    const channel = client.channels.cache.get(message.channelId);

    if (channel?.type !== 11 && channel?.type !== 15) return; // must be thread channel(all forum posts are Threads)
    const parent_id =
      channel?.type === 11 ? channel.parentId : channel.id ?? '0';

    // Only process messages from relevant channels
    const topicId = await getForumLinkedTopic(parent_id);
    if (!topicId) return;

    // 2. Figure out if message is comment or thread
    const new_message: IDiscordMessage = {
      user: {
        id: message.author?.id ?? null,
        username: message.author?.username ?? null,
      },
      // If title is nothing == comment. channel_id will correspond to the thread channel id.
      content: message.content ?? null,
      message_id: message.id ?? null,
      channel_id: message.channelId ?? null,
      parent_channel_id: parent_id ?? null,
      guild_id: message.guildId ?? null,
      imageUrls: getImageUrls(message),
      action, // Indicates how the consumer should handle the message
    };

    if (!message.nonce) new_message.title = channel.name;

    // 3. Publish the message to RabbitMQ queue
    try {
      await controller.publish(new_message, RascalPublications.DiscordListener);
      log.info(
        `Message published to RabbitMQ: ${JSON.stringify(message.content)}`,
      );
    } catch (error) {
      log.info(`Error publishing to rabbitMQ`, error);
    }
  } catch (error) {
    log.info(`Error Processing Discord Message`, error);
  }
}

export async function handleThreadChannel(
  controller: RabbitMQController,
  thread: ThreadChannel,
  action: DiscordAction,
  oldThread?: ThreadChannel,
) {
  log.info(
    `Discord Thread Channel Event received from channel ID: ${thread.id} with action: ${action}`,
  );
  try {
    // only handle public channels in the Discord forum
    // https://discord.com/developers/docs/resources/channel#channel-object-channel-types
    if (thread.type !== 11) return;

    // Only process messages from relevant channels
    const topicId = await getForumLinkedTopic(thread.parentId);
    if (!topicId) return;

    if (action === 'thread-delete') {
      await controller.publish(
        {
          message_id: thread.id,
          parent_channel_id: thread.parentId,
          action,
        } as any,
        RascalPublications.DiscordListener,
      );
    } else {
      if (!oldThread) return;

      if (thread.name !== oldThread.name) {
        const owner = await thread.fetchOwner();
        await controller.publish(
          {
            user: {
              id: owner.user.id,
              username: owner.user.username,
            },
            message_id: thread.id,
            parent_channel_id: thread.parentId,
            title: thread.name,
            action,
          } as any,
          RascalPublications.DiscordListener,
        );
      }
    }
  } catch (e) {
    log.error(`Error Processing Discord Message`, e);
  }
}
