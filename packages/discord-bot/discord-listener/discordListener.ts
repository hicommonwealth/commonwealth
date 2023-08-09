import { Client, Message, IntentsBitField, ThreadChannel } from 'discord.js';
import { sequelize } from '../utils/database';
import {
  RabbitMQController,
  getRabbitMQConfig,
} from 'common-common/src/rabbitmq';
import { RascalPublications } from 'common-common/src/rabbitmq/types';
import { DiscordAction, IDiscordMessage } from 'common-common/src/types';
import { RABBITMQ_URI, DISCORD_TOKEN } from '../utils/config';
import { factory, formatFilename } from 'common-common/src/logging';
import v8 from 'v8';

const log = factory.getLogger(formatFilename(__filename));

log.info(
  `Node Option max-old-space-size set to: ${JSON.stringify(
    v8.getHeapStatistics().heap_size_limit / 1000000000
  )} GB`
);

const getImageUrls = (message: Partial<Message>) => {
  if (!message.attachments) return [];
  const attachments = [...message.attachments.values()];

  return attachments
    .filter((attachment) => {
      return attachment.contentType.startsWith('image');
    })
    .map((attachment) => {
      return attachment.url;
    });
};

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMessages,
  ],
});

const handleMessage = async (
  message: Partial<Message>,
  action: DiscordAction
) => {
  try {
    // 1. Filter for designated forum channels
    const channel = client.channels.cache.get(message.channelId);

    if (channel?.type !== 11 && channel?.type !== 15) return; // must be thread channel(all forum posts are Threads)
    const parent_id =
      channel?.type === 11 ? channel.parentId : channel.id ?? '0';

    // Only process messages from relevant channels
    const relevantChannels = (
      await sequelize.query(
        'SELECT channel_id FROM "Topics" WHERE channel_id is not null'
      )
    )[0];
    if (relevantChannels.length === 0) return;
    if (
      !relevantChannels
        .map((topic: any) => topic['channel_id'])
        .includes(parent_id)
    )
      return;

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
      await initPromise;
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
};

const controller = new RabbitMQController(getRabbitMQConfig(RABBITMQ_URI));
const initPromise = controller.init();

client.on('ready', () => {
  log.info('Discord bot is ready.');
});

client.on('threadDelete', async (thread: ThreadChannel) => {
  await handleMessage(
    { id: thread.id, channelId: thread.parentId } as Partial<Message>,
    'thread-delete'
  );
});

client.on('messageDelete', async (message: Message) => {
  await handleMessage(message, 'comment-delete');
});

client.on('messageUpdate', async (oldMessage: Message, newMessage: Message) => {
  await handleMessage(newMessage, 'update');
});

client.on('messageCreate', async (message: Message) => {
  await handleMessage(message, 'create');
});

client.login(DISCORD_TOKEN);
