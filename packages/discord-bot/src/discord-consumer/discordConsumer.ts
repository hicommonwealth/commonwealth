import {
  HotShotsStats,
  RabbitMQAdapter,
  RascalConfigServices,
  ServiceKey,
  getRabbitMQConfig,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import {
  Broker,
  BrokerSubscriptions,
  EventHandler,
  Policy,
  broker,
  events,
  logger,
  stats,
} from '@hicommonwealth/core';
import {
  CommentDiscordActions,
  IDiscordMessage,
  ThreadDiscordActions,
} from '@hicommonwealth/model';
import { DISCORD_BOT_ADDRESS } from '@hicommonwealth/shared';
import v8 from 'v8';
import { ZodUndefined } from 'zod';
import { config } from '../config';
import { getForumLinkedTopic } from '../util';
import { handleCommentMessages, handleThreadMessages } from './handlers';

const log = logger(import.meta);
stats({
  adapter: HotShotsStats(),
});

let isServiceHealthy = false;

startHealthCheckLoop({
  service: ServiceKey.DiscordBotConsumer,
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

const processDiscordMessageCreated: EventHandler<
  'DiscordMessageCreated',
  ZodUndefined
> = async ({ payload }) => {
  try {
    const parsedMessage = payload as IDiscordMessage;
    const topic = await getForumLinkedTopic(parsedMessage.parent_channel_id);
    const action = parsedMessage.action;
    const sharedReqData = {
      auth: config.DISCORD.CW_BOT_KEY,
      discord_meta: {
        message_id: parsedMessage.message_id,
        channel_id: parsedMessage.parent_channel_id,
        user: parsedMessage.user,
      },
      author_chain: topic.community_id,
      address: DISCORD_BOT_ADDRESS,
      chain: topic.community_id,
    };

    if (
      [
        'thread-delete',
        'thread-title-update',
        'thread-body-update',
        'thread-create',
      ].includes(action)
    ) {
      await handleThreadMessages(
        action as ThreadDiscordActions,
        parsedMessage,
        topic,
        sharedReqData,
      );
    } else {
      await handleCommentMessages(
        action as CommentDiscordActions,
        parsedMessage,
        sharedReqData,
      );
    }

    stats().increment('cw.discobot_message_processed', {
      chain: topic.community_id,
      action: action,
    });
  } catch (error) {
    // non 2XX response
    if (error.response) {
      const msg =
        'Axios Error - Failed to process message:' +
        `\n\tStatus: ${error.response.status}` +
        `\n\tData: ${JSON.stringify(error.response.data)}`;
      log.error(msg, new Error(error.response.data.error));
    } else {
      log.error(`Failed to process Message:`, error);
    }
  }
};

async function main() {
  config.APP_ENV === 'local' && console.log(config);

  let brokerInstance: Broker;
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
    brokerInstance = rmqAdapter;
  } catch (e) {
    log.error('Broker setup failed', e);
    throw e;
  }

  const inputs = {
    DiscordMessageCreated: events.DiscordMessageCreated,
  };

  function Discord(): Policy<typeof inputs> {
    return {
      inputs,
      body: {
        DiscordMessageCreated: processDiscordMessageCreated,
      },
    };
  }

  const result = await brokerInstance.subscribe(
    BrokerSubscriptions.DiscordListener,
    Discord(),
  );

  if (!result) {
    throw new Error(
      `Failed to subscribe to ${BrokerSubscriptions.DiscordListener}`,
    );
  }

  isServiceHealthy = true;
}

main().catch((err) => {
  log.fatal(err);
});
