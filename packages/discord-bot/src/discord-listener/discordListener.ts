import {
  HotShotsStats,
  PinoLogger,
  RabbitMQAdapter,
  RascalConfigServices,
  ServiceKey,
  getRabbitMQConfig,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import { Broker, broker, logger, stats } from '@hicommonwealth/core';
import {
  Client,
  IntentsBitField,
  Message,
  MessageType,
  ThreadChannel,
} from 'discord.js';
import v8 from 'v8';
import { DISCORD_TOKEN, RABBITMQ_URI } from '../utils/config';

const log = logger(PinoLogger()).getLogger(__filename);
stats(HotShotsStats());

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
  // async imports to delay calling logger
  const { handleMessage, handleThreadChannel } = await import(
    '../discord-listener/handlers'
  );

  let controller: Broker;
  try {
    const rmqAdapter = new RabbitMQAdapter(
      getRabbitMQConfig(RABBITMQ_URI, RascalConfigServices.DiscobotService),
    );
    await rmqAdapter.init();
    broker(rmqAdapter);
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
    await handleThreadChannel(controller, thread, 'thread-delete');
  });

  // only used for thread title updates - thread body are handled through the 'messageUpdate' event
  client.on(
    'threadUpdate',
    async (oldThread: ThreadChannel, newThread: ThreadChannel) => {
      await handleThreadChannel(
        controller,
        newThread,
        'thread-title-update',
        oldThread,
      );
    },
  );

  client.on('messageDelete', async (message: Message) => {
    await handleMessage(controller, client, message, 'comment-delete');
  });

  client.on(
    'messageUpdate',
    async (oldMessage: Message, newMessage: Message) => {
      await handleMessage(
        controller,
        client,
        newMessage,
        newMessage.nonce ? 'comment-update' : 'thread-body-update',
      );
    },
  );

  client.on('messageCreate', async (message: Message) => {
    // this conditional prevents handling of messages like ChannelNameChanged which
    // are emitted inside a thread but which we do not want to replicate in the CW thread.
    // Thread/channel name changes are handled in threadUpdate since the that event comes
    // from the root thread/channel and thus contains the correct id.
    // Handling a name change from here would result in a new thread being created rather than updated on CW
    // since the id of the event is not the id of the actual post/thread.
    if (message.type === MessageType.Default) {
      await handleMessage(
        controller,
        client,
        message,
        message.nonce ? 'comment-create' : 'thread-create',
      );
    }
  });

  await client.login(DISCORD_TOKEN);
}

startDiscordListener().catch((e) => {
  log.fatal(e);
});
