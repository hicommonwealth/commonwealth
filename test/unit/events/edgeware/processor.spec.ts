import chai from 'chai';
import { Header, EventRecord, Extrinsic } from '@polkadot/types/interfaces';

import Processor from '../../../../shared/events/edgeware/processor';
import { SubstrateEventKind, ISubstrateSlash } from '../../../../shared/events/edgeware/types';
import { constructFakeApi } from './testUtil';

const { assert } = chai;

interface IFakeEvent {
  section: string;
  method: string;
  data: any;
}

const constructFakeBlock = (blockNumber: number, events: IFakeEvent[], extrinsics = []) => {
  return {
    header: {
      hash: blockNumber,
      number: blockNumber,
    } as unknown as Header,
    events: events.map(
      (event) => ({ event } as unknown as EventRecord)
    ),
    versionNumber: 10,
    versionName: 'edgeware',
    extrinsics: extrinsics as Extrinsic[],
  };
};

describe('Edgeware Event Processor Tests', () => {
  it('should process blocks into events', (done) => {
    // setup fake data
    const fakeEvents: IFakeEvent[] = [
      {
        section: 'staking',
        method: 'Slash',
        data: [ 'Alice', '10000' ],
      },
      {
        section: 'democracy',
        method: 'Proposed',
        data: [ '4', '100000' ],
      },
      {
        section: 'democracy',
        method: 'Started',
        data: [ '5', 'Supermajorityapproval' ],
      },
    ];

    const fakeExtrinsics = [
      {
        method: {
          sectionName: 'elections',
          methodName: 'submitCandidacy',
          args: [],
        },
        signer: 'Alice',
        data: new Uint8Array(),
      }
    ];

    const fakeBlocks = [
      constructFakeBlock(1, fakeEvents.slice(0, 2)),
      constructFakeBlock(2, fakeEvents.slice(2, 3), fakeExtrinsics),
    ];

    const api = constructFakeApi({
      publicProps: async () => {
        return [ [ ], [ 4, 'hash', 'Alice' ] ];
      },
      referendumInfoOf: async (idx) => {
        if (+idx === 5) {
          return {
            isSome: true,
            isNone: false,
            unwrap: () => {
              return {
                proposalHash: 'hash',
                voteThreshold: 'Supermajorityapproval',
                end: 123,
                delay: 20,
              };
            },
          };
        } else {
          throw new Error('bad referendum idx');
        }
      },
    });

    // run test
    const processor = new Processor(api);
    Promise.all(
      fakeBlocks.map((block) => processor.process(block))
    ).then((results) => {
      assert.equal(processor.lastBlockNumber, 2);
      assert.deepEqual(results[0], [
        {
          /* eslint-disable dot-notation */
          data: {
            kind: SubstrateEventKind.Slash,
            validator: 'Alice',
            amount: '10000',
          } as ISubstrateSlash,
          blockNumber: 1,
          includeAddresses: ['Alice'],
        },
        {
          data: {
            kind: SubstrateEventKind.DemocracyProposed,
            proposalIndex: 4,
            proposalHash: 'hash',
            deposit: '100000',
            proposer: 'Alice',
          },
          excludeAddresses: ['Alice'],
          blockNumber: 1,
        },
      ]);
      assert.deepEqual(results[1], [
        {
          data: {
            kind: SubstrateEventKind.DemocracyStarted,
            referendumIndex: 5,
            proposalHash: 'hash',
            voteThreshold: 'Supermajorityapproval',
            endBlock: 123,
          },
          blockNumber: 2,
        },
        {
          data: {
            kind: SubstrateEventKind.ElectionCandidacySubmitted,
            candidate: 'Alice',
          },
          blockNumber: 2,
          excludeAddresses: ['Alice'],
        }
      ]);
      done();
    }).catch((err) => done(err));
  });

  it('should process old and new versions differently', (done) => {
    done();
  });

  it('should fail gracefully to find a kind', (done) => {
    // setup fake data
    const fakeEvents: IFakeEvent[] = [
      {
        section: 'staking',
        method: 'Fake',
        data: [ 'Alice', '10000' ],
      },
    ];

    const block = constructFakeBlock(1, fakeEvents);
    const api = constructFakeApi({});

    // run test
    const processor = new Processor(api);
    processor.process(block).then((results) => {
      try {
        assert.equal(processor.lastBlockNumber, 1);
        assert.deepEqual(results, []);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('should fail gracefully to find an extrinsic', (done) => {
    // setup fake data
    const fakeExtrinsics = [
      {
        method: {
          sectionName: 'elections',
          methodName: 'submitBetterCandidacy',
          args: [],
        },
        signer: 'Alice',
        data: new Uint8Array(),
      }
    ];

    const block = constructFakeBlock(1, [], fakeExtrinsics);
    const api = constructFakeApi({});

    // run test
    const processor = new Processor(api);
    processor.process(block).then((results) => {
      try {
        assert.equal(processor.lastBlockNumber, 1);
        assert.deepEqual(results, []);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('should fail gracefully on invalid option during enrichment', (done) => {
    // setup fake data
    const fakeEvents: IFakeEvent[] = [
      {
        section: 'staking',
        method: 'Bonded',
        data: [ 'Alice', '10000' ],
      },
    ];

    const block = constructFakeBlock(1, fakeEvents);

    const api = constructFakeApi({
      bonded: async () => {
        return {
          isNone: true,
          isEmpty: true,
          isSome: false,
          value: null,
          unwrap: () => { throw new Error('no value'); },
        };
      },
    });

    const processor = new Processor(api);
    processor.process(block).then((results) => {
      try {
        assert.equal(processor.lastBlockNumber, 1);
        assert.deepEqual(results, []);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('should fail gracefully on invalid api call during enrichment', (done) => {
    // setup fake data
    const fakeEvents: IFakeEvent[] = [
      {
        section: 'staking',
        method: 'Bonded',
        data: [ 'Alice', '10000' ],
      },
    ];

    const block = constructFakeBlock(1, fakeEvents);
    const api = constructFakeApi({ });

    const processor = new Processor(api);
    processor.process(block).then((results) => {
      try {
        assert.equal(processor.lastBlockNumber, 1);
        assert.deepEqual(results, []);
        done();
      } catch (err) {
        done(err);
      }
    });
  });
});
