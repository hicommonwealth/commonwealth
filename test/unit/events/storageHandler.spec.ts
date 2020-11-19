/* eslint-disable no-unused-expressions */
/* eslint-disable dot-notation */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';

import { CWEvent, SubstrateTypes } from '@commonwealth/chain-events';

import { resetDatabase } from '../../../server-test';
import models from '../../../server/database';
import Hash from '../../../server/util/chainEventHash';
import StorageHandler from '../../../server/eventHandlers/storage';

chai.use(chaiHttp);
const { assert } = chai;

describe('Event Storage Handler Tests', () => {
  before('reset database', async () => {
    await resetDatabase();
  });

  it('should create chain event', async () => {
    // setup
    const event: CWEvent = {
      blockNumber: 10,
      data: {
        kind: SubstrateTypes.EventKind.DemocracyStarted,
        referendumIndex: 0,
        endBlock: 100,
        proposalHash: 'hash',
        voteThreshold: 'Supermajorityapproval',
      }
    };

    const eventHandler = new StorageHandler(models, 'edgeware');

    // process event
    const dbEvent = await eventHandler.handle(event);

    // expect results
    assert.deepEqual(dbEvent.event_data, event.data);
    assert.deepEqual(dbEvent.hash, Hash(event));
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

  it('should truncate long preimage args', async () => {
    // setup
    const event: CWEvent<SubstrateTypes.IPreimageNoted> = {
      blockNumber: 10,
      data: {
        kind: SubstrateTypes.EventKind.PreimageNoted,
        proposalHash: 'hash',
        noter: 'n',
        preimage: {
          method: 'm',
          section: 's',
          args: ['0x123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890'],
        }
      }
    };
    const truncatedData: SubstrateTypes.IPreimageNoted = {
      kind: SubstrateTypes.EventKind.PreimageNoted,
      proposalHash: 'hash',
      noter: 'n',
      preimage: {
        method: 'm',
        section: 's',
        args: ['0x1234567890123456789012345678901234567890123456789012345678901…'],
      }
    };

    const eventHandler = new StorageHandler(models, 'edgeware');

    // process event
    const dbEvent = await eventHandler.handle(event);

    // expect results
    assert.deepEqual(dbEvent.event_data, truncatedData);
    const chainEvents = await models['ChainEvent'].findAll({
      where: {
        chain_event_type_id: 'edgeware-preimage-noted',
        block_number: 10,
      }
    });
    assert.lengthOf(chainEvents, 1);
    assert.deepEqual(chainEvents[0].toJSON(), dbEvent.toJSON());
  });

  it('should create duplicate events for skipped type', async () => {
    const event: CWEvent = {
      blockNumber: 11,
      data: {
        kind: SubstrateTypes.EventKind.Unbonded,
        stash: 'a',
        amount: '1000',
        controller: 'c',
      }
    };

    const eventHandler = new StorageHandler(models, 'edgeware', [], [ SubstrateTypes.EventKind.Unbonded ]);
    // process event
    const dbEvent = await eventHandler.handle(event);
    const dbEvent2 = await eventHandler.handle(event);

    // expect results
    assert.deepEqual(dbEvent.event_data, event.data);
    assert.deepEqual(dbEvent2.event_data, event.data);
    const chainEvents = await models['ChainEvent'].findAll({
      where: {
        chain_event_type_id: 'edgeware-unbonded',
        block_number: 11,
      }
    });
    assert.lengthOf(chainEvents, 2);
    assert.sameDeepMembers(
      chainEvents.map((c) => c.toJSON()),
      [ dbEvent, dbEvent2 ].map((c) => c.toJSON()),
    );
  });

  it('should not create db event for duplicates', async () => {
    // setup
    const event: CWEvent = {
      blockNumber: 11,
      data: {
        kind: SubstrateTypes.EventKind.DemocracyStarted,
        referendumIndex: 1,
        endBlock: 100,
        proposalHash: 'hash2',
        voteThreshold: 'Supermajorityapproval',
      }
    };

    const eventHandler = new StorageHandler(models, 'edgeware');

    // process event
    const dbEvent = await eventHandler.handle(event);
    const dbEvent2 = await eventHandler.handle(event);

    // expect results
    assert.isUndefined(dbEvent2);
    assert.deepEqual(dbEvent.event_data, event.data);
    const chainEvents = await models['ChainEvent'].findAll({
      where: {
        chain_event_type_id: 'edgeware-democracy-started',
        block_number: 11,
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

  it('should not create chain event for unknown event type', async () => {
    const event = {
      blockNumber: 13,

      data: {
        kind: 'democracy-exploded',
        whoops: true,
      }
    };

    const eventHandler = new StorageHandler(models, 'edgeware');

    // process event
    const dbEvent = await eventHandler.handle(event as unknown as CWEvent);

    // confirm no event emitted
    assert.isUndefined(dbEvent);
    const chainEvents = await models['ChainEvent'].findAll({
      where: {
        chain_event_type_id: 'edgeware-democracy-exploded',
        block_number: 12,
      }
    });
    assert.lengthOf(chainEvents, 0);
  });

  it('should not create chain event for excluded event type', async () => {
    const event: CWEvent = {
      blockNumber: 13,
      data: {
        kind: SubstrateTypes.EventKind.Reward,
        amount: '10000',
      }
    };
    const eventHandler = new StorageHandler(models, 'edgeware', [ SubstrateTypes.EventKind.Reward ]);

    // process event
    const dbEvent = await eventHandler.handle(event as unknown as CWEvent);

    // confirm no event emitted
    assert.isUndefined(dbEvent);
    const chainEvents = await models['ChainEvent'].findAll({
      where: {
        chain_event_type_id: 'edgeware-reward',
        block_number: 13,
      }
    });
    assert.lengthOf(chainEvents, 0);
  });
});
