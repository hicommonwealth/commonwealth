import {Client, Message, ThreadChannel} from "discord.js";
import {DiscordAction, IDiscordMessage} from "common-common/src/types";
import {getForumLinkedTopicId, getImageUrls} from "discord-bot/discord-listener/util";
import {RascalPublications} from "common-common/src/rabbitmq/types";
import {RabbitMQController} from "common-common/src/rabbitmq";
import {factory, formatFilename} from "common-common/src/logging";

const log = factory.getLogger(formatFilename(__filename));

export async function handleMessage (
  controller: RabbitMQController,
  client: Client,
  message: Partial<Message>,
  action: DiscordAction
) {
  try {
    // 1. Filter for designated forum channels
    const channel = client.channels.cache.get(message.channelId);

    if (channel?.type !== 11 && channel?.type !== 15) return; // must be thread channel(all forum posts are Threads)
    const parent_id =
      channel?.type === 11 ? channel.parentId : channel.id ?? '0';

    // Only process messages from relevant channels
    const topicId = await getForumLinkedTopicId(parent_id);
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
        `Message published to RabbitMQ: ${JSON.stringify(message.content)}`
      );
    } catch (error) {
      log.info(`Error publishing to rabbitMQ`, error);
    }
  } catch (error) {
    log.info(`Error Processing Discord Message`, error);
  }
}

export async function handleThreadChannel (
  thread: ThreadChannel,
  action: DiscordAction,
  oldThread?: ThreadChannel
) {
  try {
    // only handle public channels in the Discord forum
    // https://discord.com/developers/docs/resources/channel#channel-object-channel-types
    if (thread.type !== 11) return;

    // Only process messages from relevant channels
    const topicId = await getForumLinkedTopicId(thread.parentId);
    if (!topicId) return;

    if (action === 'thread-delete') {

    }

  } catch (e) {

  }
}