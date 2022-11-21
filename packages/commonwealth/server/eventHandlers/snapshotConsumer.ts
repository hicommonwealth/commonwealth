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
import models from '../database';
import { RABBITMQ_URI } from '../config';

async function processSnapshotMessage(msg: SnapshotNotification) {
  const log = factory.getLogger(formatFilename(__filename));
  try {
    console.log('Processing snapshot message', msg);
    const { space, id, title, body, choices, start, expire } = msg;

    // Check if Space Exists, create it if not

    // Check if proposal exists, create it if not

    console.log('message id,', msg.event);
    const eventType = msg.event;

    const proposal = await models.SnapshotProposal.findOne({
      where: { id: msg.id },
    });

    if (eventType === 'proposal/created') {
      if (!proposal) {
        await models.SnapshotProposal.create({
          id,
          title,
          body,
          choices,
          start,
          event: eventType,
          expire,
          space,
        });
      }
    } else {
      if (!proposal) {
        throw new Error('Proposal does not exist');
      }
    }

    if (!proposal) {
      await models.SnapshotProposal.create({
        id: msg.id,
        title: msg.title,
        body: msg.body,
        choices: msg.choices,
        space: msg.space,
        event: msg.event,
        start: msg.start,
        expire: msg.expire,
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
