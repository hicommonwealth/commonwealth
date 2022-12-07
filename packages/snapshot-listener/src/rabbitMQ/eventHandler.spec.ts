import {assert} from 'chai';
import { SnapshotEvent } from '../types';
import { RabbitMqHandler } from './eventHandler';
import { RascalPublications, 
  RascalSubscriptions, 
  getRabbitMQConfig 
} from "common-common/src/rabbitmq";
import { RABBITMQ_URI } from '../config';

describe.skip('RabbitMQ producer integration tests', () => {
  let controller: RabbitMqHandler;

  beforeEach('Initialize RabbitMQ Controller', () => {
    controller = new RabbitMqHandler(
      getRabbitMQConfig(RABBITMQ_URI), 
      RascalPublications.SnapshotListener
    )
  })

  it('should initialize a RabbitMQ producer with the default config', async function () {
    await controller.init();
    assert.isNotNull(controller.broker);
  });

  it('should publish a SnapshotEvent to a queue', async function () {
    await controller.init();
    const sub = await controller.startSubscription(
    async (event: SnapshotEvent) => {
        assert.equal(event.id, 'proposal/0x42');
        assert.equal(event.space, 'test.eth')
        assert.equal(event.event, 'test/created');
        assert.isNumber(event.expire);
      }, 
      RascalSubscriptions.SnapshotListener
    );

    controller.handle({
      id: 'proposal/0x42',
      space: 'test.eth',
      event: 'test/created',
      expire: '0'
    });
  });

  xit('should prevent excluded events from being published', async function () {
    await controller.init();
    const sub = await controller.startSubscription(
      async (event: SnapshotEvent) => {
        assert.equal(event.id, 'proposal/0x42');
        assert.equal(event.space, 'test.eth')
        assert.equal(event.event, 'test/created');
        assert.isNumber(event.expire);
      }, 
      RascalSubscriptions.SnapshotListener
    );

    controller.handle({
      id: 'proposal/0x42',
      space: 'test.eth',
      event: 'test/created',
      expire: '0'
    });

    controller.handle({
      id: 'proposal/0x424242',
      space: 'test.eth',
      event: 'test/created',
      expire: '0'
    });
  });
});
