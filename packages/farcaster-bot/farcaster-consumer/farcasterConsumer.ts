import {
  RabbitMQController,
  getRabbitMQConfig,
} from 'common-common/src/rabbitmq';
import {
  RascalSubscriptions,
  TRmqMessages,
} from 'common-common/src/rabbitmq/types';
import { IFarcasterMessage } from 'common-common/src/types';
import { RABBITMQ_URI, SERVER_URL, CW_BOT_KEY } from '../utils/config';
import axios from 'axios';
import v8 from 'v8';
import { factory, formatFilename } from 'common-common/src/logging';
import { StatsDController } from 'common-common/src/statsd';
import {
  ServiceKey,
  startHealthCheckLoop,
} from 'common-common/src/scripts/startHealthCheckLoop';

let isServiceHealthy = false;

startHealthCheckLoop({
  service: ServiceKey.FarcasterBotConsumer,
  checkFn: async () => {
    if (!isServiceHealthy) {
      throw new Error('service not healthy');
    }
  },
});

const log = factory.getLogger(formatFilename(__filename));

log.info(
  `Node Option max-old-space-size set to: ${JSON.stringify(
    v8.getHeapStatistics().heap_size_limit / 1000000000
  )} GB`
);

const controller = new RabbitMQController(getRabbitMQConfig(RABBITMQ_URI));

async function consumeMessages() {
  await controller.init();

  const processMessage = async (data: TRmqMessages) => {
    try {
      const parsedMessage = data as IFarcasterMessage;
      console.log({ parsedMessage });
      // TODO: Logic for handling messages
    } catch (error) {
      log.error(`Failed to process Message:`, error);
    }
  };
  await controller.startSubscription(
    processMessage,
    RascalSubscriptions.FarcasterListener
  );

  isServiceHealthy = true;
}

consumeMessages();
