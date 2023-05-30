import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import { StorageHandler } from 'chain-events/services/ChainEventsConsumer/ChainEventHandlers';
import models from 'chain-events/services/database/database';

import type { CWEvent } from 'chain-events/src';
import { SupportedNetwork } from 'chain-events/src';
import { getRabbitMQConfig } from 'common-common/src/rabbitmq';
import { MockRabbitMQController } from 'common-common/src/rabbitmq/mockRabbitMQController';
import type { BrokerConfig } from 'rascal';
import { EventKind, IEventData } from '../../../src/chains/aave/types';

chai.use(chaiHttp);
const { assert } = chai;
const chain = 'aave';

const rmqController = new MockRabbitMQController(
  <BrokerConfig>getRabbitMQConfig('localhost')
);

describe('Event Storage Handler Tests', () => {
  before(async () => {
    await models.sequelize.sync({ force: true });
    await rmqController.init();
  });

  it('should create chain event', async () => {
    // setup
    const event: CWEvent<IEventData> = {
      blockNumber: 10,
      network: SupportedNetwork.Aave,
      data: {
        kind: EventKind.ProposalCreated,
        id: 1,
        proposer: '0x327BeaE3B570d9bdD8C6b9236199991Ab2c5fefe',
        executor: '0x06C2E02aDB73238d7eE7DbD69fEA12B14091cB8a',
        targets: ['0x6972E49bFbA4dbc4981101724CC87bd18c152cBA'],
        values: ['testValue'],
        signatures: ['testSignature'],
        calldatas: ['testCalldatas'],
        startBlock: 10,
        endBlock: 100,
        strategy: 'testStrategy',
        ipfsHash: 'testIpfsHash',
      },
    };

    const eventHandler = new StorageHandler(models, rmqController, chain);

    // process event
    const dbEvent = await eventHandler.handle(event);

    // expect results
    assert.deepEqual(dbEvent.event_data, event.data);
    const chainEvents = await models.ChainEvent.findAll({
      where: {
        chain: 'aave',
        block_number: 10,
      },
    });
    assert.lengthOf(chainEvents, 1);
    assert.deepEqual(chainEvents[0].toJSON(), dbEvent.toJSON());
  });

  it('should not create chain event for excluded event type', async () => {
    const event: CWEvent<IEventData> = {
      blockNumber: 13,
      network: SupportedNetwork.Aave,
      data: {
        kind: EventKind.ProposalCreated,
        id: 1,
        proposer: '0x327BeaE3B570d9bdD8C6b9236199991Ab2c5fefe',
        executor: '0x06C2E02aDB73238d7eE7DbD69fEA12B14091cB8a',
        targets: ['0x6972E49bFbA4dbc4981101724CC87bd18c152cBA'],
        values: ['testValue'],
        signatures: ['testSignature'],
        calldatas: ['testCalldatas'],
        startBlock: 10,
        endBlock: 100,
        strategy: 'testStrategy',
        ipfsHash: 'testIpfsHash',
      },
    };

    const eventHandler = new StorageHandler(models, rmqController, chain, {
      excludedEvents: [EventKind.ProposalCreated],
    });

    // process event
    const dbEvent = await eventHandler.handle(event as unknown as CWEvent);

    // confirm no event emitted
    assert.isUndefined(dbEvent);
    const chainEvents = await models.ChainEvent.findAll({
      where: {
        chain: 'aave',
        block_number: 13,
      },
    });
    assert.lengthOf(chainEvents, 0);
  });
});
