import { Client, Message, IntentsBitField } from 'discord.js';
import { sequelize } from '../utils/database';
import {
  RabbitMQController,
  getRabbitMQConfig,
} from 'common-common/src/rabbitmq';
import { RascalPublications } from 'common-common/src/rabbitmq/types';
import { IDiscordMessage } from 'common-common/src/types';
import { RABBITMQ_URI, DISCORD_TOKEN } from '../utils/config';

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMessages,
  ],
});

const controller = new RabbitMQController(getRabbitMQConfig(RABBITMQ_URI));
const initPromise = controller.init();

client.on('ready', () => {
  console.log('Discord bot is ready.');
});

client.on('messageCreate', async (message: Message) => {
  try {
    // 1. Filter for designated forum channels
    const channel = client.channels.cache.get(message.channelId);
    if (channel?.type !== 11) return; // must be thread channel(all forum posts are Threads)
    const parent_id = channel.parentId ?? '0';
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
        id: message.author.id,
        username: message.author.username,
      },
      // If title is nothing == comment. channel_id will correspond to the thread channel id.
      content: message.content,
      message_id: message.id,
      channel_id: message.channelId,
      parent_channel_id: parent_id,
    };

    if (!message.nonce) new_message.title = channel.name;

    // 3. Publish the message to RabbitMQ queue
    try {
      await initPromise;
      await controller.publish(new_message, RascalPublications.DiscordListener);
      console.log('Message published to RabbitMQ:', message.content);
    } catch (error) {
      console.log(`Error publishing to rabbitMQ: ${error}`);
    }
  } catch (error) {
    console.log(`Error Processing Discord Message: ${error}`);
  }
});

client.login(DISCORD_TOKEN);
