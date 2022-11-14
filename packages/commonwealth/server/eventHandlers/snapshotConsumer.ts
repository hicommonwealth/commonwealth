import { Server } from 'socket.io';
import { ServiceConsumer } from 'common-common/src/serviceConsumer';
import { RabbitMQController } from 'common-common/src/rabbitmq/rabbitMQController';
import { getRabbitMQConfig } from 'common-common/src/rabbitmq';
import { SnapshotNotification } from '../../shared/types';
import { createSnapshotNamespace } from '../socket/snapshotNamespace';
import { RABBITMQ_URI } from '../config';

export default async function startSnapshotConsumer() {
  try {
    const rabbitMQController = new RabbitMQController(
      getRabbitMQConfig(RABBITMQ_URI)
    );

    const consumer = new ServiceConsumer(
      'SnapshotListenerExchange',
      rabbitMQController,
      //RabbitMQSub
    );

    await consumer.init();
  } catch (err) {
    console.log(err);
  }
}
