import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import { StorageHandler } from 'chain-events/services/ChainEventsConsumer/ChainEventHandlers';
import models from 'chain-events/services/database/database';

import type { CWEvent } from 'chain-events/src';
import { SupportedNetwork } from 'chain-events/src';
import { SubstrateTypes } from 'chain-events/src/types';
import { getRabbitMQConfig } from 'common-common/src/rabbitmq';
import { MockRabbitMQController } from 'common-common/src/rabbitmq/mockRabbitMQController';
import type { BrokerConfig } from 'rascal';

chai.use(chaiHttp);
const { assert } = chai;
const chain = 'edgeware';

const rmqController = new MockRabbitMQController(
  <BrokerConfig>getRabbitMQConfig('localhost')
);

describe('Event Storage Handler Tests', () => {
  it('should create chain event', async () => {
    // setup
    const event: CWEvent = {
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

    const eventHandler = new StorageHandler(models, rmqController, chain);

    // process event
    const dbEvent = await eventHandler.handle(event);

    // expect results
    assert.deepEqual(dbEvent.event_data, event.data);
    const chainEvents = await models['ChainEvent'].findAll({
      where: {
        chain: 'edgeware',
        block_number: 10,
      },
    });
    assert.lengthOf(chainEvents, 1);
    assert.deepEqual(chainEvents[0].toJSON(), dbEvent.toJSON());
  });

  it('should truncate long preimage args', async () => {
    // setup
    const event: CWEvent<SubstrateTypes.IPreimageNoted> = {
      blockNumber: 10,
      network: SupportedNetwork.Substrate,
      data: {
        kind: SubstrateTypes.EventKind.PreimageNoted,
        proposalHash: 'hash',
        noter: 'n',
        preimage: {
          method: 'm',
          section: 's',
          args: [
            '0x123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
          ],
        },
      },
    };
    const truncatedData: SubstrateTypes.IPreimageNoted = {
      kind: SubstrateTypes.EventKind.PreimageNoted,
      proposalHash: 'hash',
      noter: 'n',
      preimage: {
        method: 'm',
        section: 's',
        args: [
          '0x1234567890123456789012345678901234567890123456789012345678901…',
        ],
      },
    };

    const eventHandler = new StorageHandler(models, rmqController, chain);

    // process event
    const dbEvent = await eventHandler.handle(event);

    // expect results
    assert.deepEqual(dbEvent.event_data, truncatedData);
    const chainEvents = await models['ChainEvent'].findAll({
      where: {
        chain: 'edgeware',
        block_number: 10,
      },
    });
    assert.lengthOf(chainEvents, 1);
    assert.deepEqual(chainEvents[0].toJSON(), dbEvent.toJSON());
  });

  it('should create chain event and type for unknown event type', async () => {
    const event = {
      blockNumber: 13,
      network: SupportedNetwork.Substrate,
      data: {
        kind: 'democracy-exploded',
        whoops: true,
      },
    };

    const eventHandler = new StorageHandler(models, rmqController, chain);

    // process event
    const dbEvent = await eventHandler.handle(event as unknown as CWEvent);

    // expect results
    assert.deepEqual(dbEvent.event_data, event.data);
    const chainEvents = await models['ChainEvent'].findAll({
      where: {
        chain: 'edgeware',
        block_number: 13,
      },
    });
    assert.lengthOf(chainEvents, 1);
    assert.deepEqual(chainEvents[0].toJSON(), dbEvent.toJSON());
  });

  it('should not create chain event for excluded event type', async () => {
    const event: CWEvent = {
      blockNumber: 13,
      network: SupportedNetwork.Substrate,
      data: {
        kind: SubstrateTypes.EventKind.Reward,
        amount: '10000',
      },
    };
    const eventHandler = new StorageHandler(models, rmqController, chain, {
      excludedEvents: [SubstrateTypes.EventKind.Reward],
    });

    // process event
    const dbEvent = await eventHandler.handle(event as unknown as CWEvent);

    // confirm no event emitted
    assert.isUndefined(dbEvent);
    const chainEvents = await models['ChainEvent'].findAll({
      where: {
        chain: 'edgeware',
        block_number: 13,
      },
    });
    assert.lengthOf(chainEvents, 0);
  });
});
