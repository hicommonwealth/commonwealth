import { Broker, EventContext } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { BrokerTopics, DiscordAction } from '@hicommonwealth/shared';
import { Client, Message, ThreadChannel } from 'discord.js';
import { fileURLToPath } from 'url';
import { getImageUrls } from '../discord-listener/util';
import { getForumLinkedTopic } from '../utils/util';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

export async function handleMessage(
  controller: Broker,
  client: Client,
  message: Partial<Message>,
  action: DiscordAction,
) {
  log.info(
    `Discord message received from channel ID: ${message.channelId} with action: ${action}`,
  );
  let event: EventContext<'DiscordMessageCreated'>;

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
    event = {
      name: 'DiscordMessageCreated',
      payload: {
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
      },
    };

    if (!message.nonce) event.payload.title = channel.name;
  } catch (error) {
    log.error(`Error Processing Discord Message`, error);
    return;
  }

  // 3. Publish the message to RabbitMQ queue
  const result = await controller.publish(BrokerTopics.DiscordListener, event);

  if (!result) {
    log.error(`Failed to publish event`, undefined, {
      event,
    });
  }

  log.info(`Event published`, {
    event,
  });
}

export async function handleThreadChannel(
  controller: Broker,
  thread: ThreadChannel,
  action: DiscordAction,
  oldThread?: ThreadChannel,
) {
  log.info(
    `Discord Thread Channel Event received from channel ID: ${thread.id} with action: ${action}`,
  );
  let event: EventContext<'DiscordMessageCreated'>;
  try {
    // only handle public channels in the Discord forum
    // https://discord.com/developers/docs/resources/channel#channel-object-channel-types
    if (thread.type !== 11) return;

    // Only process messages from relevant channels
    const topicId = await getForumLinkedTopic(thread.parentId);
    if (!topicId) return;

    if (action === 'thread-delete') {
      event = {
        name: 'DiscordMessageCreated',
        payload: {
          message_id: thread.id,
          parent_channel_id: thread.parentId,
          action,
        },
      };
    } else {
      if (!oldThread) return;

      if (thread.name !== oldThread.name) {
        const owner = await thread.fetchOwner();
        event = {
          name: 'DiscordMessageCreated',
          payload: {
            user: {
              id: owner.user.id,
              username: owner.user.username,
            },
            message_id: thread.id,
            parent_channel_id: thread.parentId,
            title: thread.name,
            action,
          },
        };
      }
    }
  } catch (e) {
    log.error(`Error Processing Discord Message`, e);
  }

  if (event) {
    const result = await controller.publish(
      BrokerTopics.DiscordListener,
      event,
    );

    if (!result) {
      log.error('Failed to publish event', undefined, {
        event,
      });
    }

    log.info(`Event published`, {
      event,
    });
  }
}
