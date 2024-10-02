import {
  getRabbitMQConfig,
  HotShotsStats,
  RabbitMQAdapter,
  RascalConfigServices,
  ServiceKey,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import {
  Broker,
  broker,
  EventNames,
  logger,
  stats,
} from '@hicommonwealth/core';
import {
  Client,
  IntentsBitField,
  MessageType,
  ThreadChannel,
} from 'discord.js';
import v8 from 'v8';
import { config } from '../../config';
import { handleMessage, handleThreadChannel } from './handlers';

const log = logger(import.meta);
stats({
  adapter: HotShotsStats(),
});

let isServiceHealthy = false;

startHealthCheckLoop({
  service: ServiceKey.DiscordBotListener,
  checkFn: async () => {
    if (!isServiceHealthy) {
      throw new Error('service not healthy');
    }
  },
});

log.info(
  `Node Option max-old-space-size set to: ${JSON.stringify(
    v8.getHeapStatistics().heap_size_limit / 1000000000,
  )} GB`,
);

async function startDiscordListener() {
  config.APP_ENV === 'local' && console.log(config);

  let controller: Broker;
  try {
    const rmqAdapter = new RabbitMQAdapter(
      getRabbitMQConfig(
        config.BROKER.RABBITMQ_URI,
        RascalConfigServices.DiscobotService,
      ),
    );
    await rmqAdapter.init();
    broker({
      adapter: rmqAdapter,
    });
    controller = rmqAdapter;
  } catch (e) {
    log.error('Broker setup failed', e instanceof Error ? e : undefined);
    throw e;
  }

  const client = new Client({
    intents: [
      IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.MessageContent,
      IntentsBitField.Flags.GuildMessages,
    ],
  });

  client.on('ready', () => {
    log.info('Discord bot is ready.');
    isServiceHealthy = true;
  });

  // event types can be found here: https://gist.github.com/koad/316b265a91d933fd1b62dddfcc3ff584

  client.on('threadDelete', async (thread: ThreadChannel) => {
    await handleThreadChannel(thread, EventNames.DiscordThreadDeleted);
  });

  // only used for thread title updates - thread body are handled through the 'messageUpdate' event
  client.on(
    'threadUpdate',
    async (oldThread: ThreadChannel, newThread: ThreadChannel) => {
      await handleThreadChannel(
        newThread,
        EventNames.DiscordThreadTitleUpdated,
        oldThread,
      );
    },
  );

  client.on('messageDelete', async (message) => {
    await handleMessage(
      client,
      message,
      EventNames.DiscordThreadCommentDeleted,
    );
  });

  client.on('messageUpdate', async (_, newMessage) => {
    await handleMessage(
      client,
      newMessage,
      newMessage.nonce
        ? EventNames.DiscordThreadCommentUpdated
        : EventNames.DiscordThreadBodyUpdated,
    );
  });

  client.on('messageCreate', async (message) => {
    // this conditional prevents handling of messages like ChannelNameChanged which
    // are emitted inside a thread but which we do not want to replicate in the CW thread.
    // Thread/channel name changes are handled in threadUpdate since the that event comes
    // from the root thread/channel and thus contains the correct id.
    // Handling a name change from here would result in a new thread being created rather than updated on CW
    // since the id of the event is not the id of the actual post/thread.
    if (message.type === MessageType.Default) {
      await handleMessage(
        client,
        message,
        message.nonce
          ? EventNames.DiscordThreadCommentCreated
          : EventNames.DiscordThreadCreated,
      );
    }
  });

  await client.login(config.DISCORD.BOT_TOKEN);
}

startDiscordListener().catch((e) => {
  log.fatal(e);
});
