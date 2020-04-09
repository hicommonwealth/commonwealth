import chai from 'chai';
import { Header, EventRecord } from '@polkadot/types/interfaces';

import Processor from '../../../../shared/events/edgeware/processor';
import { SubstrateEventType } from '../../../../shared/events/edgeware/types';

const { assert } = chai;

interface IFakeEvent {
  section: string;
  method: string;
  data: any[];
  typeDef: {
    types: string[];
  };
}

const constructFakeBlock = (blockNumber: number, events: IFakeEvent[]) => {
  return {
    header: {
      hash: blockNumber,
      number: blockNumber,
    } as unknown as Header,
    events: events.map(
      (event) => ({ event } as unknown as EventRecord)
    ),
  };
};

/* eslint-disable: dot-notation */
describe('Edgeware Event Processor Tests', () => {
  it('should process blocks into events', (done) => {
    // setup fake data
    const fakeEvents: IFakeEvent[] = [
      {
        section: 'staking',
        method: 'Slash',
        data: [ 'Alice', '10000' ],
        typeDef: {
          types: [ 'string', 'string' ],
        }
      },
      {
        section: 'staking',
        method: 'Bonded',
        data: [ 'Alice', '10000' ],
        typeDef: {
          types: [ 'string', 'string' ],
        }
      },
      {
        section: 'democracy',
        method: 'Proposed',
        data: [ ],
        typeDef: {
          types: [ ],
        }
      },
      {
        section: 'democracy',
        method: 'Passed',
        data: [ '5' ],
        typeDef: {
          types: [ 'string' ],
        }
      },
    ];

    const fakeBlocks = [
      constructFakeBlock(1, fakeEvents.slice(0, 3)),
      constructFakeBlock(2, fakeEvents.slice(3, 4)),
    ];

    // run test
    const processor = new Processor();
    assert.deepEqual(processor.process(fakeBlocks[0]), [
      {
        type: SubstrateEventType.Slash,
        data: [ 'Alice', '10000' ],
        blockNumber: 1,
      },
      {
        type: SubstrateEventType.DemocracyProposed,
        data: [ ],
        blockNumber: 1,
      },
    ]);
    assert.deepEqual(processor.process(fakeBlocks[1]), [
      {
        type: SubstrateEventType.DemocracyPassed,
        data: [ '5' ],
        blockNumber: 2,
      },
    ]);
    done();
  });

  // TODO: fail tests
});
