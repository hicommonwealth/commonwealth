import {
  ServiceConsumer,
  RabbitMQSubscription,
} from 'common-common/src/serviceConsumer';
import { RabbitMQController } from 'common-common/src/rabbitmq/rabbitMQController';
import {
  getRabbitMQConfig,
  RascalSubscriptions,
} from 'common-common/src/rabbitmq';
import { factory, formatFilename } from 'common-common/src/logging';
import { SnapshotNotification } from '../../shared/types';
import  models from '../database';
import { RABBITMQ_URI } from '../config';

async function processSnapshotMessage(msg: SnapshotNotification) {
const log = factory.getLogger(formatFilename(__filename));
  try {
    const proposal = await models.SnapshotProposal.findOne({
      where: { id: msg.id },
    });

    if (!proposal) {
      await models.SnapshotProposal.create({
        id: msg.id,
        space: msg.space,
        event: msg.event,
        expire: msg.expire
      });
      log.info(`Created new snapshot proposal: ${msg.id}`);
    }

  } catch (err) {
    log.error(`Error processing snapshot message: ${err}`);
  }
}

function createSnapshotSubscription(): RabbitMQSubscription {
  return {
    messageProcessor: processSnapshotMessage,
    subscriptionName: RascalSubscriptions.SnapshotListener,
  };
}

async function startSnapshotConsumer() {
  try {
    const controller = new RabbitMQController(getRabbitMQConfig(RABBITMQ_URI));
    const subscriptions = [createSnapshotSubscription()];

    const consumer = new ServiceConsumer(
      RascalSubscriptions.SnapshotListener,
      controller,
      subscriptions
    );

    await consumer.init();
  } catch (err) {
    console.log(err);
  }
}

export default startSnapshotConsumer;
