import { Server } from 'socket.io';
import { ServiceConsumer } from 'common-common/src/serviceConsumer';
import { RabbitMQController } from 'common-common/src/rabbitmq/rabbitMQController';
import { getRabbitMQConfig } from 'common-common/src/rabbitmq';
import { SnapshotNotification } from '../../shared/types';
import { createSnapshotNamespace } from '../socket/snapshotNamespace';
import { RABBITMQ_URI } from '../config';

function publishToSnapshotRoom(
  this: Server,
  notification: SnapshotNotification
) {
  this.to(notification.id).emit('snapshot', notification);
}

export default async function startSnapshotConsumer() {
  try {
    const rabbitMQController = new RabbitMQController(
      getRabbitMQConfig(RABBITMQ_URI)
    );

    const snapshotNamespace = createSnapshotNamespace;

    const subs = [];
    subs.push(publishToSnapshotRoom.bind(snapshotNamespace));

    const consumer = new ServiceConsumer(
      'SnapshotListenerExchange',
      rabbitMQController,
      subs
    );

    await consumer.init();
  } catch (err) {
    console.log(err);
  }
}
