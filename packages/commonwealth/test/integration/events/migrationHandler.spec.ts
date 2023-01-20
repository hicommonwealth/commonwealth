/* eslint-disable no-unused-expressions */
/* eslint-disable dot-notation */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import MigrationHandler from 'chain-events/services/ChainEventsConsumer/ChainEventHandlers/migration';
import StorageHandler from 'chain-events/services/ChainEventsConsumer/ChainEventHandlers/storage';
import models from 'chain-events/services/database/database';

import type { CWEvent } from 'chain-events/src';
import { SupportedNetwork } from 'chain-events/src';
import { SubstrateTypes } from 'chain-events/src/types';
import { getRabbitMQConfig } from 'common-common/src/rabbitmq';
import { MockRabbitMQController } from 'common-common/src/rabbitmq/mockRabbitMQController';
import type { BrokerConfig } from 'rascal';

import { resetDatabase } from '../../../server-test';

chai.use(chaiHttp);
const { assert } = chai;

const rmqController = new MockRabbitMQController(
  <BrokerConfig>getRabbitMQConfig('localhost')
);

const setupDbEvent = async (event: CWEvent) => {
  const storageHandler = new StorageHandler(models, rmqController, 'edgeware');
  return storageHandler.handle(event);
};

describe('Edgeware Migration Event Handler Tests', () => {
  before('reset database', async () => {
    await resetDatabase();
  });

  it('should create new event', async () => {
    // setup
    const event: CWEvent<SubstrateTypes.IEventData> = {
      blockNumber: 10,
      network: SupportedNetwork.Substrate,
      data: {
        kind: SubstrateTypes.EventKind.DemocracyStarted,
        referendumIndex: 0,
        endBlock: 100,
        proposalHash: 'hash',
        voteThreshold: 'Supermajorityapproval',
      },
    };

    const eventHandler = new MigrationHandler(
      models,
      rmqController,
      'edgeware'
    );

    // process event
    const dbEvent = await eventHandler.handle(event);

    // expect results
    assert.deepEqual(dbEvent.event_data, event.data);
    const chainEvents = await models['ChainEvent'].findAll({
      where: {
        chain_event_type_id: 'edgeware-democracy-started',
        block_number: 10,
      },
    });
    assert.lengthOf(chainEvents, 1);
    assert.deepEqual(chainEvents[0].toJSON(), dbEvent.toJSON());

    const dbEventType = await dbEvent.getChainEventType();
    const chainEventType = await models['ChainEventType'].findOne({
      where: { id: 'edgeware-democracy-started' },
    });
    assert.deepEqual(chainEventType.toJSON(), dbEventType.toJSON());
  });

  it('should upgrade existing event', async () => {
    const legacyEvent: any = {
      blockNumber: 10,
      network: SupportedNetwork.Substrate,
      data: {
        kind: SubstrateTypes.EventKind.PreimageNoted,
        proposalHash: 'hash',
        noter: 'Alice',
      },
    };
    const currentEvent: CWEvent<SubstrateTypes.IEventData> = {
      blockNumber: 10,
      network: SupportedNetwork.Substrate,
      data: {
        kind: SubstrateTypes.EventKind.PreimageNoted,
        proposalHash: 'hash',
        noter: 'Alice',
        preimage: {
          method: 'method',
          section: 'section',
          args: ['arg1', 'arg2'],
        },
      },
    };

    const oldDbEvent = await setupDbEvent(legacyEvent);
    const eventHandler = new MigrationHandler(
      models,
      rmqController,
      'edgeware'
    );

    // process event
    const dbEvent = await eventHandler.handle(currentEvent);
    assert.deepEqual(dbEvent.event_data, currentEvent.data);
    const chainEvents = await models['ChainEvent'].findAll({
      where: {
        chain_event_type_id: 'edgeware-preimage-noted',
        block_number: 10,
      },
    });
    assert.lengthOf(chainEvents, 1);
    assert.deepEqual(chainEvents[0].toJSON(), dbEvent.toJSON());

    const dbEventType = await dbEvent.getChainEventType();
    const chainEventType = await models['ChainEventType'].findOne({
      where: { id: 'edgeware-preimage-noted' },
    });
    assert.deepEqual(chainEventType.toJSON(), dbEventType.toJSON());
  });

  it('should ignore irrelevant events', async () => {
    const event: CWEvent<SubstrateTypes.IEventData> = {
      blockNumber: 11,
      includeAddresses: ['5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'],
      network: SupportedNetwork.Substrate,
      data: {
        kind: SubstrateTypes.EventKind.Slash,
        validator: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        amount: '10000',
      },
    };

    const eventHandler = new MigrationHandler(
      models,
      rmqController,
      'edgeware'
    );

    // process event
    const dbEvent = await eventHandler.handle(event);
    assert.equal(dbEvent, null);
  });

  it('should ignore unknown events', async () => {
    const event = {
      blockNumber: 13,
      network: SupportedNetwork.Substrate,
      data: {
        kind: 'democracy-exploded',
        whoops: true,
      },
    };

    const eventHandler = new MigrationHandler(
      models,
      rmqController,
      'edgeware'
    );

    // process event
    const dbEvent = await eventHandler.handle(
      event as unknown as CWEvent<SubstrateTypes.IEventData>
    );
    assert.equal(dbEvent, null);
  });
});
