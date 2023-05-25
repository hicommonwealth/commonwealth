import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import EntityArchivalHandler from 'chain-events/services/ChainEventsConsumer/ChainEventHandlers/entityArchival';
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

describe('Aave Archival Event Handler Tests', () => {
  before(async () => {
    await models.sequelize.sync({ force: true });
    await rmqController.init();
  });

  it('should create chain entity from event', async () => {
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

    const dbEvent = await setupDbEvent(event);

    const eventHandler = new EntityArchivalHandler(
      models,
      rmqController,
      'aave'
    );

    // process event
    const handledDbEvent = await eventHandler.handle(event, dbEvent);

    // verify outputs
    const entity = await handledDbEvent.getChainEntity();
    assert.equal(entity.chain, 'aave');
    assert.equal(entity.type, 'proposal');
    assert.equal(entity.type_id, '1');
    const events = await entity.getChainEvents();
    assert.deepEqual(
      events.map((e) => e.toJSON()),
      [handledDbEvent.toJSON()]
    );
  });

  it('should update chain entity from event', async () => {
    const createEvent: CWEvent<IEventData> = {
      blockNumber: 10,
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

    const updateEvent: CWEvent<IEventData> = {
      blockNumber: 125,
      network: SupportedNetwork.Aave,
      data: {
        kind: EventKind.ProposalExecuted,
        id: 2,
      },
    };

    const createDbEvent = await setupDbEvent(createEvent);
    const updateDbEvent = await setupDbEvent(updateEvent);

    const eventHandler = new EntityArchivalHandler(
      models,
      rmqController,
      'aave'
    );

    // process event
    const handleCreateEvent = await eventHandler.handle(
      createEvent,
      createDbEvent
    );
    const handleUpdateEvent = await eventHandler.handle(
      updateEvent,
      updateDbEvent
    );

    // verify outputs
    const entity = await handleCreateEvent.getChainEntity();
    const updateEntity = await handleUpdateEvent.getChainEntity();
    assert.deepEqual(entity, updateEntity);
    assert.equal(entity.chain, 'aave');
    assert.equal(entity.type, 'proposal');
    assert.equal(entity.type_id, '2');
    const events = await entity.getChainEvents();
    assert.sameDeepMembers(
      events.map((e) => e.toJSON()),
      [createDbEvent.toJSON(), updateDbEvent.toJSON()]
    );
  });

  it('should ignore events not related to any entity', async () => {
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

    const dbEvent = await setupDbEvent(event);

    const eventHandler = new EntityArchivalHandler(
      models,
      rmqController,
      'aave'
    );

    // process event
    const handledDbEvent = await eventHandler.handle(event, dbEvent);

    // we skip all non-entity related events
    assert.isUndefined(handledDbEvent);
    assert.isUndefined(dbEvent);
  });

  it('should ignore duplicate entities', async () => {
    const createEvent: CWEvent<IEventData> = {
      blockNumber: 10,
      network: SupportedNetwork.Aave,
      data: {
        kind: EventKind.ProposalCreated,
        id: 3,
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

    const dbEvent = await setupDbEvent(createEvent);
    const eventHandler = new EntityArchivalHandler(
      models,
      rmqController,
      'aave'
    );

    // process event twice
    const handledDbEvent = await eventHandler.handle(createEvent, dbEvent);
    try {
      // event handler should throw if it receives a duplicate event
      await eventHandler.handle(createEvent, dbEvent);
      assert.fail();
    } catch (e) {}

    // verify outputs
    const chainEntities = await models.ChainEntity.findAll({
      where: {
        chain: 'aave',
        type_id: '3',
      },
    });
    assert.lengthOf(chainEntities, 1);
    const entity = await handledDbEvent.getChainEntity();
    assert.deepEqual(entity.toJSON(), chainEntities[0].toJSON());
  });
});
