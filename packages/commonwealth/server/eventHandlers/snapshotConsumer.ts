import { ServiceConsumer } from 'common-common/src/serviceConsumer';
import { RabbitMQController } from 'common-common/src/rabbitmqController';


export default function StartSnapshotConsumer() {

  const rabbitMQController = new RabbitMQController();

  const consumer = new ServiceConsumer('snapshot', rabbitMQController);
  consumer.start();
}
