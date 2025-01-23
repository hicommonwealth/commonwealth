import { GenericContainer, Wait } from 'testcontainers';
import { config } from '../../../../../server/config';

export async function setupRabbitMq() {
  const rabbitMQContainer = await new GenericContainer(
    'rabbitmq:3.11-management',
  )
    .withExposedPorts(5672, 15672)
    .withWaitStrategy(Wait.forLogMessage('Server startup complete'))
    .start();

  console.log(
    `rabbitMQ management port`,
    rabbitMQContainer.getMappedPort(15672),
  );

  config.BROKER.RABBITMQ_URI = `amqp://127.0.0.1:${rabbitMQContainer.getMappedPort(5672)}`;

  return rabbitMQContainer;
}
