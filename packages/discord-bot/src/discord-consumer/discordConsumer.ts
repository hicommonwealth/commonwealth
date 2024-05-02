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
  EventHandler,
  Policy,
  broker,
  events,
  stats,
} from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import {
  BrokerSubscriptions,
  CommentDiscordActions,
  IDiscordMessage,
  ThreadDiscordActions,
} from '@hicommonwealth/shared';
import { fileURLToPath } from 'url';
import v8 from 'v8';
import { ZodUndefined } from 'zod';
import { CW_BOT_KEY, DISCOBOT_ADDRESS, RABBITMQ_URI } from '../utils/config';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);
stats(HotShotsStats());

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
  // async imports to delay calling logger
  const { handleCommentMessages, handleThreadMessages } = await import(
    '../discord-consumer/handlers'
  );
  const { getForumLinkedTopic } = await import('../utils/util');

  try {
    const parsedMessage = payload as IDiscordMessage;
    const topic = await getForumLinkedTopic(parsedMessage.parent_channel_id);
    const action = parsedMessage.action;
    const sharedReqData = {
      auth: CW_BOT_KEY,
      discord_meta: {
        message_id: parsedMessage.message_id,
        channel_id: parsedMessage.parent_channel_id,
        user: parsedMessage.user,
      },
      author_chain: topic.community_id,
      address: DISCOBOT_ADDRESS,
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
  let brokerInstance: Broker;
  try {
    const rmqAdapter = new RabbitMQAdapter(
      getRabbitMQConfig(RABBITMQ_URI, RascalConfigServices.DiscobotService),
    );
    await rmqAdapter.init();
    broker(rmqAdapter);
    brokerInstance = rmqAdapter;
  } catch (e) {
    log.error('Broker setup failed', e);
    throw e;
  }

  const inputs = {
    DiscordMessageCreated: events.DiscordMessageCreated,
  };

  const Discord: Policy<typeof inputs> = () => ({
    inputs,
    body: {
      DiscordMessageCreated: processDiscordMessageCreated,
    },
  });

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
