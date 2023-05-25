import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import MigrationHandler from 'chain-events/services/ChainEventsConsumer/ChainEventHandlers/migration';
import StorageHandler from 'chain-events/services/ChainEventsConsumer/ChainEventHandlers/storage';
import models from 'chain-events/services/database/database';
import type { CWEvent } from 'chain-events/src';
import { SupportedNetwork } from 'chain-events/src';
import { getRabbitMQConfig } from 'common-common/src/rabbitmq';
import { MockRabbitMQController } from 'common-common/src/rabbitmq/mockRabbitMQController';
import type { BrokerConfig } from 'rascal';
import { EventKind, IEventData } from '../../../src/chains/aave/types';

chai.use(chaiHttp);
const { assert } = chai;

const rmqController = new MockRabbitMQController(
  <BrokerConfig>getRabbitMQConfig('localhost')
);

const setupDbEvent = async (event: CWEvent) => {
  const storageHandler = new StorageHandler(models, rmqController, 'aave');
  return storageHandler.handle(event);
};

describe('Aave Migration Event Handler Tests', () => {
  before(async () => {
    await models.sequelize.sync({ force: true });
    await rmqController.init();
  });

  it('should create new event', async () => {
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

    const eventHandler = new MigrationHandler(models, rmqController, 'aave');

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

  it('should update an existing event', async () => {
    const legacyEvent: CWEvent<IEventData> = {
      blockNumber: 11,
      network: SupportedNetwork.Aave,
      data: {
        kind: EventKind.ProposalCreated,
        id: 2,
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
    const currentEvent: CWEvent<IEventData> = {
      blockNumber: 11,
      network: SupportedNetwork.Aave,
      data: {
        kind: EventKind.ProposalCreated,
        id: 2,
        proposer: 'newProposer',
        executor: 'newExecutor',
        targets: ['newTarget'],
        values: ['testValue'],
        signatures: ['testSignature'],
        calldatas: ['testCalldatas'],
        startBlock: 10,
        endBlock: 100,
        strategy: 'testStrategy',
        ipfsHash: 'testIpfsHash',
      },
    };

    const oldDbEvent = await setupDbEvent(legacyEvent);
    const eventHandler = new MigrationHandler(models, rmqController, 'aave');

    // process event
    const dbEvent = await eventHandler.handle(currentEvent);
    assert.deepEqual(dbEvent.event_data, currentEvent.data);
    const chainEvents = await models.ChainEvent.findAll({
      where: {
        chain: 'aave',
        block_number: 11,
      },
    });
    assert.lengthOf(chainEvents, 1);
    assert.deepEqual(chainEvents[0].toJSON(), dbEvent.toJSON());
  });

  it('should ignore events that are not related to an entity', async () => {
    const event: CWEvent<IEventData> = {
      blockNumber: 125,
      network: SupportedNetwork.Aave,
      data: {
        kind: EventKind.Transfer,
        tokenAddress: 'testAddress',
        from: 'testFrom',
        to: 'testTo',
        amount: '10000',
      },
    };

    const eventHandler = new MigrationHandler(models, rmqController, 'aave');

    // process event
    const dbEvent = await eventHandler.handle(event);
    assert.equal(dbEvent, null);
  });

  it('should ignore unknown events', async () => {
    const event = {
      blockNumber: 13,
      network: SupportedNetwork.Aave,
      data: {
        kind: 'democracy-exploded',
        whoops: true,
      },
    };

    const eventHandler = new MigrationHandler(models, rmqController, 'aave');

    // process event
    const dbEvent = await eventHandler.handle(
      event as unknown as CWEvent<IEventData>
    );
    assert.equal(dbEvent, null);
  });
});
