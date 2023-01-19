/* eslint-disable no-unused-expressions */
/* eslint-disable dot-notation */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import EntityArchivalHandler from 'chain-events/services/ChainEventsConsumer/ChainEventHandlers/entityArchival';
import StorageHandler from 'chain-events/services/ChainEventsConsumer/ChainEventHandlers/storage';
import models from 'chain-events/services/database/database';
import type { CWEvent } from 'chain-events/src';
import { SupportedNetwork } from 'chain-events/src';
import { SubstrateTypes } from 'chain-events/src/types';
import { getRabbitMQConfig } from 'common-common/src/rabbitmq';
import { MockRabbitMQController } from 'common-common/src/rabbitmq/mockRabbitMQController';
import { EventEmitter } from 'events';
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

describe('Edgeware Archival Event Handler Tests', () => {
  before('reset database', async () => {
    await resetDatabase();
  });

  it('should create chain entity from event', async () => {
    const event: CWEvent<SubstrateTypes.IEventData> = {
      blockNumber: 10,
      network: SupportedNetwork.Substrate,
      data: {
        kind: SubstrateTypes.EventKind.DemocracyStarted,
        referendumIndex: 3,
        endBlock: 100,
        proposalHash: 'hash',
        voteThreshold: 'Supermajorityapproval',
      },
    };

    const dbEvent = await setupDbEvent(event);
    const dbEventType = await dbEvent.getChainEventType();

    const eventHandler = new EntityArchivalHandler(
      models,
      rmqController,
      'edgeware'
    );

    // process event
    const handledDbEvent = await eventHandler.handle(event, dbEvent);

    // verify outputs
    const entity = await handledDbEvent.getChainEntity();
    assert.equal(entity.chain, 'edgeware');
    assert.equal(entity.type, SubstrateTypes.EntityKind.DemocracyReferendum);
    assert.equal(entity.type_id, '3');
    const events = await entity.getChainEvents();
    assert.deepEqual(
      events.map((e) => e.toJSON()),
      [handledDbEvent.toJSON()]
    );
  });

  it('should update chain entity from event', async () => {
    const createEvent: CWEvent<SubstrateTypes.IEventData> = {
      blockNumber: 20,
      network: SupportedNetwork.Substrate,
      data: {
        kind: SubstrateTypes.EventKind.TreasuryProposed,
        proposalIndex: 5,
        proposer: 'Alice',
        value: '100',
        beneficiary: 'Bob',
        bond: '5',
      },
    };

    const updateEvent: CWEvent<SubstrateTypes.IEventData> = {
      blockNumber: 25,
      network: SupportedNetwork.Substrate,
      data: {
        kind: SubstrateTypes.EventKind.TreasuryAwarded,
        proposalIndex: 5,
        value: '100',
        beneficiary: 'Bob',
      },
    };

    const createDbEvent = await setupDbEvent(createEvent);
    const createDbEventType = await createDbEvent.getChainEventType();
    const updateDbEvent = await setupDbEvent(updateEvent);
    const updateDbEventType = await updateDbEvent.getChainEventType();

    // set up wss expected results
    const mockWssServer = new EventEmitter();
    // let nEmissions = 0;
    // mockWssServer.on(WebsocketMessageNames.ChainEntity, (payload) => {
    //   assert.equal(payload.event, WebsocketMessageNames.ChainEntity);
    //   if (nEmissions === 0) {
    //     assert.deepEqual(payload.data.chainEvent, createDbEvent.toJSON());
    //     assert.deepEqual(payload.data.chainEventType, createDbEventType.toJSON());
    //     assert.equal(payload.data.chainEntity.chain, 'edgeware');
    //     assert.equal(payload.data.chainEntity.type, SubstrateTypes.EntityKind.TreasuryProposal);
    //     assert.equal(payload.data.chainEntity.type_id, '5');
    //   } else if (nEmissions === 1) {
    //     assert.deepEqual(payload.data.chainEvent, updateDbEvent.toJSON());
    //     assert.deepEqual(payload.data.chainEventType, updateDbEventType.toJSON());
    //     assert.equal(payload.data.chainEntity.chain, 'edgeware');
    //     assert.equal(payload.data.chainEntity.type, SubstrateTypes.EntityKind.TreasuryProposal);
    //     assert.equal(payload.data.chainEntity.type_id, '5');
    //   } else {
    //     assert.fail('more than 2 emissions');
    //   }
    //   nEmissions++;
    // });
    const eventHandler = new EntityArchivalHandler(
      models,
      rmqController,
      'edgeware'
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
    assert.equal(entity.chain, 'edgeware');
    assert.equal(entity.type, SubstrateTypes.EntityKind.TreasuryProposal);
    assert.equal(entity.type_id, '5');
    const events = await entity.getChainEvents();
    assert.sameDeepMembers(
      events.map((e) => e.toJSON()),
      [createDbEvent.toJSON(), updateDbEvent.toJSON()]
    );
  });

  it('should ignore unrelated events', async () => {
    const event: CWEvent<SubstrateTypes.IEventData> = {
      blockNumber: 11,
      network: SupportedNetwork.Substrate,
      data: {
        kind: SubstrateTypes.EventKind.Slash,
        validator: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        amount: '10000',
      },
    };

    const dbEvent = await setupDbEvent(event);

    // set up wss expected results
    const mockWssServer = new EventEmitter();
    // mockWssServer.on(WebsocketMessageNames.ChainEntity, (payload) => {
    //   assert.fail('should not emit event');
    // });
    const eventHandler = new EntityArchivalHandler(
      models,
      rmqController,
      'edgeware'
    );

    // process event
    const handledDbEvent = await eventHandler.handle(event, dbEvent);

    // verify outputs
    assert.deepEqual(dbEvent, handledDbEvent);
    assert.isNull(dbEvent.entity_id);
  });

  it('should ignore duplicate entities', async () => {
    const event: CWEvent<SubstrateTypes.IEventData> = {
      blockNumber: 10,
      network: SupportedNetwork.Substrate,
      data: {
        kind: SubstrateTypes.EventKind.DemocracyStarted,
        referendumIndex: 6,
        endBlock: 100,
        proposalHash: 'hash',
        voteThreshold: 'Supermajorityapproval',
      },
    };

    const dbEvent = await setupDbEvent(event);
    const eventHandler = new EntityArchivalHandler(
      models,
      rmqController,
      'edgeware'
    );

    // process event twice
    const handledDbEvent = await eventHandler.handle(event, dbEvent);
    const duplicateEvent = await eventHandler.handle(event, dbEvent);

    // verify outputs
    assert.deepEqual(handledDbEvent, duplicateEvent);
    const chainEntities = await models['ChainEntity'].findAll({
      where: {
        chain: 'edgeware',
        type_id: '6',
      },
    });
    assert.lengthOf(chainEntities, 1);
    const entity = await handledDbEvent.getChainEntity();
    assert.deepEqual(entity.toJSON(), chainEntities[0].toJSON());
  });
});
