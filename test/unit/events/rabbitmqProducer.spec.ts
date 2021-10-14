import Rascal from 'rascal';
import { assert } from 'chai';
import { RabbitMqProducer as Producer } from '../../../server/eventHandlers/rabbitmqPlugin/producer';
import { getRabbitMQConfig } from '../../../server/eventHandlers/rabbitmqPlugin';

// Assumes: A live local CW server, a live local RabbitMQ server
describe.skip('RabbitMQ producer integration tests', () => {
  let producer, consumer;

  it('should initialize a RabbitMQ producer with the default config', async function () {
    producer = await new Producer(getRabbitMQConfig());
    await producer.init();
    assert.isNotNull(producer.broker);
  });

  it('should publish a CWEvent to a queue', async function () {
    consumer = await Rascal.BrokerAsPromised.create(
      Rascal.withDefaultConfig(getRabbitMQConfig())
    );

    const sub = await consumer.subscribe('eventsSub');
    sub.on('message', (message, content, ackOrNack) => {
      assert.equal(content.blockNumber, 10);
      assert.equal(content.data, {});
      assert.equal(content.chain, 'polkadot');
      assert.equal(content.network, 'substrate');
      assert.equal(content.received, 123);
    });

    producer.handle({
      blockNumber: 10,
      data: {},
      chain: 'polkadot',
      network: 'substrate',
      received: 123,
    });
  });

  it('should prevent excluded events from being published', async function () {
    const sub = await consumer.subscribe('eventsSub');
    sub.on('message', (message, content, ackOrNack) => {
      assert.equal(content.blockNumber, 10);
      assert.equal(content.data, {});
      assert.equal(content.chain, 'polkadot');
      assert.equal(content.network, 'substrate');
      assert.equal(content.received, 123);
    });

    producer.handle({
      blockNumber: 10,
      data: {
        kind: 'dont-skip',
      },
      network: 'substrate',
      chain: 'polkadot',
      received: 123,
    });

    producer.handle({
      blockNumber: 99,
      data: {
        kind: 'skip',
      },
      network: 'substrate',
      chain: 'polkadot',
      received: 77,
    });
  });
});
