/* eslint-disable no-unused-expressions */
/* eslint-disable dot-notation */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import WebSocket from 'ws';

import { resetDatabase } from '../../../../server-test';
import models from '../../../../server/database';
import { CWEvent } from '../../../../shared/events/interfaces';
import StorageHandler from '../../../../server/eventHandlers/storage';
import EntityArchivalHandler from '../../../../server/eventHandlers/edgeware/entityArchival';
import { SubstrateEventKind, SubstrateEntityKind } from '../../../../shared/events/edgeware/types';

chai.use(chaiHttp);
const { assert } = chai;

class FakeWebsocketServer {
  constructor(
    private readonly _emitValidator: (event: string | symbol, ...args: any[]) => void,
  ) { }
  public emit(event: string | symbol, ...args: any[]): void {
    this._emitValidator(event, ...args);
  }
}

const setupDbEvent = async (event: CWEvent) => {
  const storageHandler = new StorageHandler(models, 'edgeware');
  return storageHandler.handle(event);
};

describe('Edgeware Archival Event Handler Tests', () => {
  before('reset database', async () => {
    await resetDatabase();
  });

  it('should create chain entity from event', async () => {
    const event: CWEvent = {
      blockNumber: 10,
      data: {
        kind: SubstrateEventKind.DemocracyStarted,
        referendumIndex: 3,
        endBlock: 100,
        proposalHash: 'hash',
        voteThreshold: 'Supermajorityapproval',
      }
    };

    const dbEvent = await setupDbEvent(event);
    const wss = new FakeWebsocketServer((wssEvent, data) => {
      assert.equal(wssEvent, 'server-event');
      // TODO: validate data
    }) as unknown as WebSocket.Server;
    const eventHandler = new EntityArchivalHandler(models, 'edgeware', wss);

    // process event
    const handledDbEvent = await eventHandler.handle(event, dbEvent);

    // verify outputs
    const entity = await handledDbEvent.getChainEntity();
    assert.equal(entity.chain, 'edgeware');
    assert.equal(entity.type, SubstrateEntityKind.DemocracyReferendum);
    assert.equal(entity.type_id, '3');
    const events = await entity.getChainEvents();
    assert.deepEqual(events.map((e) => e.toJSON()), [ handledDbEvent.toJSON() ]);
  });

  it('should update chain entity from event', async () => {
    const createEvent: CWEvent = {
      blockNumber: 20,
      data: {
        kind: SubstrateEventKind.TreasuryProposed,
        proposalIndex: 5,
        proposer: 'Alice',
        value: '100',
        beneficiary: 'Bob',
        bond: '5',
      },
    };

    const updateEvent: CWEvent = {
      blockNumber: 25,
      data: {
        kind: SubstrateEventKind.TreasuryAwarded,
        proposalIndex: 5,
        value: '100',
        beneficiary: 'Bob',
      },
    };

    const createDbEvent = await setupDbEvent(createEvent);
    const updateDbEvent = await setupDbEvent(updateEvent);
    const wss = new FakeWebsocketServer((wssEvent, data) => {
      assert.equal(wssEvent, 'server-event');
      // TODO: validate data
    }) as unknown as WebSocket.Server;
    const eventHandler = new EntityArchivalHandler(models, 'edgeware', wss);

    // process event
    const handleCreateEvent = await eventHandler.handle(createEvent, createDbEvent);
    const handleUpdateEvent = await eventHandler.handle(updateEvent, updateDbEvent);

    // verify outputs
    const entity = await handleCreateEvent.getChainEntity();
    const updateEntity = await handleUpdateEvent.getChainEntity();
    assert.deepEqual(entity, updateEntity);
    assert.equal(entity.chain, 'edgeware');
    assert.equal(entity.type, SubstrateEntityKind.TreasuryProposal);
    assert.equal(entity.type_id, '5');
    const events = await entity.getChainEvents();
    assert.sameDeepMembers(events.map((e) => e.toJSON()), [ createDbEvent.toJSON(), updateDbEvent.toJSON() ]);
  });

  it('should ignore unrelated events', async () => {
    const event: CWEvent = {
      blockNumber: 11,
      includeAddresses: ['5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'],
      data: {
        kind: SubstrateEventKind.Slash,
        validator: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        amount: '10000',
      }
    };

    const dbEvent = await setupDbEvent(event);
    const wss = new FakeWebsocketServer((wssEvent, data) => {
      assert.equal(wssEvent, 'server-event');
      // TODO: validate data
    }) as unknown as WebSocket.Server;
    const eventHandler = new EntityArchivalHandler(models, 'edgeware', wss);

    // process event
    const handledDbEvent = await eventHandler.handle(event, dbEvent);

    // verify outputs
    assert.deepEqual(dbEvent, handledDbEvent);
    assert.isNull(dbEvent.entity_id);
  });
});
