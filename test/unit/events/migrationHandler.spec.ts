/* eslint-disable no-unused-expressions */
/* eslint-disable dot-notation */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';

import { resetDatabase } from '../../../server-test';
import models from '../../../server/database';
import { CWEvent } from '../../../shared/events/interfaces';
import { SubstrateEventKind, ISubstrateEventData } from '../../../shared/events/edgeware/types';
import StorageHandler from '../../../server/eventHandlers/storage';
import MigrationHandler from '../../../server/eventHandlers/migration';

chai.use(chaiHttp);
const { assert } = chai;

const setupDbEvent = async (event: CWEvent) => {
  const storageHandler = new StorageHandler(models, 'edgeware');
  return storageHandler.handle(event);
};

describe('Edgeware Migration Event Handler Tests', () => {
  before('reset database', async () => {
    await resetDatabase();
  });

  it('should create new event', async () => {
    // setup
    const event: CWEvent<ISubstrateEventData> = {
      blockNumber: 10,
      data: {
        kind: SubstrateEventKind.DemocracyStarted,
        referendumIndex: 0,
        endBlock: 100,
        proposalHash: 'hash',
        voteThreshold: 'Supermajorityapproval',
      }
    };

    const eventHandler = new MigrationHandler(models, 'edgeware');

    // process event
    const dbEvent = await eventHandler.handle(event);

    // expect results
    assert.deepEqual(dbEvent.event_data, event.data);
    const chainEvents = await models['ChainEvent'].findAll({
      where: {
        chain_event_type_id: 'edgeware-democracy-started',
        block_number: 10,
      }
    });
    assert.lengthOf(chainEvents, 1);
    assert.deepEqual(chainEvents[0].toJSON(), dbEvent.toJSON());

    const dbEventType = await dbEvent.getChainEventType();
    const chainEventType = await models['ChainEventType'].findOne({
      where : { id: 'edgeware-democracy-started' }
    });
    assert.deepEqual(chainEventType.toJSON(), dbEventType.toJSON());
  });

  it('should upgrade existing event', async () => {
    const legacyEvent: any = {
      blockNumber: 10,
      data: {
        kind: SubstrateEventKind.PreimageNoted,
        proposalHash: 'hash',
        noter: 'Alice',
      }
    };
    const currentEvent: CWEvent<ISubstrateEventData> = {
      blockNumber: 10,
      data: {
        kind: SubstrateEventKind.PreimageNoted,
        proposalHash: 'hash',
        noter: 'Alice',
        preimage: {
          method: 'method',
          section: 'section',
          args: [ 'arg1', 'arg2' ],
        }
      }
    };

    const oldDbEvent = await setupDbEvent(legacyEvent);
    const eventHandler = new MigrationHandler(models, 'edgeware');

    // process event
    const dbEvent = await eventHandler.handle(currentEvent);
    assert.deepEqual(dbEvent.event_data, currentEvent.data);
    const chainEvents = await models['ChainEvent'].findAll({
      where: {
        chain_event_type_id: 'edgeware-preimage-noted',
        block_number: 10,
      }
    });
    assert.lengthOf(chainEvents, 1);
    assert.deepEqual(chainEvents[0].toJSON(), dbEvent.toJSON());

    const dbEventType = await dbEvent.getChainEventType();
    const chainEventType = await models['ChainEventType'].findOne({
      where : { id: 'edgeware-preimage-noted' }
    });
    assert.deepEqual(chainEventType.toJSON(), dbEventType.toJSON());
  });

  it('should ignore irrelevant events', async () => {
    const event: CWEvent<ISubstrateEventData> = {
      blockNumber: 11,
      includeAddresses: ['5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'],
      data: {
        kind: SubstrateEventKind.Slash,
        validator: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        amount: '10000',
      }
    };

    const eventHandler = new MigrationHandler(models, 'edgeware');

    // process event
    const dbEvent = await eventHandler.handle(event);
    assert.equal(dbEvent, null);
  });

  it('should ignore unknown events', async () => {
    const event = {
      blockNumber: 13,

      data: {
        kind: 'democracy-exploded',
        whoops: true,
      }
    };

    const eventHandler = new MigrationHandler(models, 'edgeware');

    // process event
    const dbEvent = await eventHandler.handle(event as unknown as CWEvent<ISubstrateEventData>);
    assert.equal(dbEvent, null);
  });
});
