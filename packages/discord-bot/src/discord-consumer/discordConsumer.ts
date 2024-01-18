import {
  RabbitMQController,
  RascalConfigServices,
  RascalSubscriptions,
  ServiceKey,
  TRmqMessages,
  getRabbitMQConfig,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import {
  CommentDiscordActions,
  IDiscordMessage,
  ThreadDiscordActions,
  logger,
  stats,
} from '@hicommonwealth/core';
import v8 from 'v8';
import {
  handleCommentMessages,
  handleThreadMessages,
} from '../discord-consumer/handlers';
import { CW_BOT_KEY, DISCOBOT_ADDRESS, RABBITMQ_URI } from '../utils/config';
import { rollbar } from '../utils/rollbar';
import { getForumLinkedTopic } from '../utils/util';

let isServiceHealthy = false;

startHealthCheckLoop({
  service: ServiceKey.DiscordBotConsumer,
  checkFn: async () => {
    if (!isServiceHealthy) {
      throw new Error('service not healthy');
    }
  },
});

const log = logger().getLogger(__filename);

log.info(
  `Node Option max-old-space-size set to: ${JSON.stringify(
    v8.getHeapStatistics().heap_size_limit / 1000000000,
  )} GB`,
);

async function processMessage(data: TRmqMessages) {
  try {
    const parsedMessage = data as IDiscordMessage;
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
      rollbar.error(msg, new Error(error.response.data.error));
    } else {
      log.error(`Failed to process Message:`, error);
      rollbar.error(`Failed to process Message:`, error);
    }
  }
}

async function consumeMessages() {
  const controller = new RabbitMQController(
    getRabbitMQConfig(RABBITMQ_URI, RascalConfigServices.DiscobotService),
  );

  await controller.init();

  await controller.startSubscription(
    processMessage,
    RascalSubscriptions.DiscordListener,
  );

  isServiceHealthy = true;
}

consumeMessages().catch((err) => {
  console.error(err);
});
