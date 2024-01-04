import {
  CommentDiscordActions,
  IDiscordMessage,
  ThreadDiscordActions,
} from '@hicommonwealth/core';
import { factory, formatFilename } from 'common-common/src/logging';
import {
  RabbitMQController,
  getRabbitMQConfig,
} from 'common-common/src/rabbitmq';
import { RascalConfigServices } from 'common-common/src/rabbitmq/rabbitMQConfig';
import {
  RascalSubscriptions,
  TRmqMessages,
} from 'common-common/src/rabbitmq/types';
import {
  ServiceKey,
  startHealthCheckLoop,
} from 'common-common/src/scripts/startHealthCheckLoop';
import { StatsDController } from 'common-common/src/statsd';
import {
  handleCommentMessages,
  handleThreadMessages,
} from 'discord-bot/discord-consumer/handlers';
import { rollbar } from 'discord-bot/utils/rollbar';
import { getForumLinkedTopic } from 'discord-bot/utils/util';
import v8 from 'v8';
import { CW_BOT_KEY, DISCOBOT_ADDRESS, RABBITMQ_URI } from '../utils/config';

let isServiceHealthy = false;

startHealthCheckLoop({
  service: ServiceKey.DiscordBotConsumer,
  checkFn: async () => {
    if (!isServiceHealthy) {
      throw new Error('service not healthy');
    }
  },
});

const log = factory.getLogger(formatFilename(__filename));

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

    StatsDController.get().increment('cw.discobot_message_processed', 1, {
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
