import { EventNames, logger } from '@hicommonwealth/core';
import { emitEvent, models } from '@hicommonwealth/model';
import {
  Client,
  Message,
  OmitPartialGroupDMChannel,
  PartialMessage,
  ThreadChannel,
} from 'discord.js';
import { getForumLinkedTopic, getImageUrls } from './util';

const log = logger(import.meta);

/**
 * Used to process the following message types: thread-create, comment-create,
 * thread-body-update, comment-update, and comment-delete
 * @param client
 * @param message
 * @param action
 */
export async function handleMessage(
  client: Client,
  message:
    | OmitPartialGroupDMChannel<Message<boolean> | PartialMessage>
    | Message<boolean>
    | PartialMessage,
  action:
    | EventNames.DiscordThreadCreated
    | EventNames.DiscordThreadBodyUpdated
    | EventNames.DiscordThreadCommentCreated
    | EventNames.DiscordThreadCommentUpdated
    | EventNames.DiscordThreadCommentDeleted,
) {
  log.info(
    `Discord message received from channel ID: ${message.channelId} with action: ${action}`,
  );
  try {
    // 1. Filter for designated forum channels
    const channel = client.channels.cache.get(message.channelId);

    if (channel?.type !== 11 && channel?.type !== 15) return; // must be thread channel(all forum posts are Threads)
    const parent_id =
      channel?.type === 11 ? channel.parentId! : (channel.id ?? '0');

    // Only process messages from relevant channels
    const topicId = await getForumLinkedTopic(parent_id);
    if (!topicId) return;

    if (!message.author?.id) {
      log.error('Missing author id', undefined, { message });
      return;
    }
    if (!message.content) {
      log.error('Missing content', undefined, { message });
      return;
    }
    if (!message.guildId) {
      log.error('Missing guild id', undefined, { message });
      return;
    }

    // 2. Figure out if message is comment or thread
    const eventPayload = {
      user: {
        id: message.author?.id,
        username: message.author?.username,
      },
      // If title is nothing == comment. channel_id will correspond to the thread channel id.
      content: message.content,
      message_id: message.id,
      channel_id: message.channelId,
      parent_channel_id: parent_id,
      guild_id: message.guildId,
      imageUrls: getImageUrls(message),
    };

    if (
      EventNames.DiscordThreadCreated === action ||
      EventNames.DiscordThreadBodyUpdated === action
    ) {
      await emitEvent(models.Outbox, [
        {
          event_name: action,
          event_payload: {
            ...eventPayload,
            title: channel.name,
          },
        },
      ]);
    } else {
      await emitEvent(models.Outbox, [
        {
          event_name: action,
          event_payload: eventPayload,
        },
      ]);
    }
  } catch (error) {
    log.error(`Error Processing Discord Message`, error);
    return;
  }
}

export async function handleThreadChannel(
  thread: ThreadChannel,
  action:
    | EventNames.DiscordThreadDeleted
    | EventNames.DiscordThreadTitleUpdated,
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
    const topicId = await getForumLinkedTopic(thread.parentId!);
    if (!topicId) return;

    if (action === EventNames.DiscordThreadDeleted) {
      await emitEvent(models.Outbox, [
        {
          event_name: EventNames.DiscordThreadDeleted,
          event_payload: {
            message_id: thread.id,
            parent_channel_id: thread.parentId!,
          },
        },
      ]);
    } else {
      if (!oldThread) return;

      if (thread.name !== oldThread.name) {
        const owner = await thread.fetchOwner();
        if (!owner?.user?.id) {
          log.error('Missing author id', undefined, { owner });
          return;
        }
        if (!owner?.user?.username) {
          log.error('Missing author username', undefined, { owner });
          return;
        }
        if (!thread.parentId) {
          log.error('Missing parent id', undefined, { owner });
          return;
        }

        await emitEvent(models.Outbox, [
          {
            event_name: EventNames.DiscordThreadTitleUpdated,
            event_payload: {
              user: {
                id: owner?.user?.id,
                username: owner?.user?.username,
              },
              message_id: thread.id,
              parent_channel_id: thread.parentId,
              title: thread.name,
            },
          },
        ]);
      }
    }
  } catch (e) {
    log.error(`Error Processing Discord Message`, e);
  }
}
