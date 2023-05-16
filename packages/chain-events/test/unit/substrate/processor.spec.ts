import chai from 'chai';
import type {
  Header,
  EventRecord,
  Extrinsic,
} from '@polkadot/types/interfaces';
import BN from 'bn.js';

import { SupportedNetwork } from '../../../src';
import { Processor } from 'chain-events/src/chain-bases/substrate/processor';
import type { ISlash } from 'chain-events/src/chain-bases/substrate/types';
import { EventKind } from 'chain-events/src/chain-bases/substrate/types';

import { constructFakeApi } from './testUtil';

const { assert } = chai;

interface IFakeEvent {
  section: string;
  method: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  phase?: {
    isApplyExtrinsic: boolean;
    asApplyExtrinsic: number;
  };
}

const constructFakeBlock = (
  blockNumber: number,
  events: IFakeEvent[],
  extrinsics = []
) => {
  return {
    header: {
      hash: blockNumber,
      number: blockNumber,
    } as unknown as Header,
    events: events.map((event) => {
      const phase = { ...event.phase };
      delete event.phase;
      return { event, phase } as unknown as EventRecord;
    }),
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
        data: ['Alice', '10000'],
      },
      {
        section: 'democracy',
        method: 'Proposed',
        data: ['4', '100000'],
      },
      {
        section: 'democracy',
        method: 'Started',
        data: ['5', 'Supermajorityapproval'],
        phase: {
          isApplyExtrinsic: true,
          asApplyExtrinsic: 0,
        },
      },
      {
        section: 'system',
        method: 'ExtrinsicSuccess',
        data: [],
        phase: {
          isApplyExtrinsic: true,
          asApplyExtrinsic: 0,
        },
      },
      {
        section: 'bounty',
        method: 'BountyProposed',
        data: ['1'],
      },
    ];

    const fakeExtrinsics = [
      {
        method: {
          section: 'elections',
          method: 'submitCandidacy',
          args: [],
        },
        signer: 'Alice',
        data: new Uint8Array(),
      },
    ];

    const fakeBlocks = [
      constructFakeBlock(1, fakeEvents.slice(0, 2)),
      constructFakeBlock(2, fakeEvents.slice(2, 5), fakeExtrinsics),
    ];

    const api = constructFakeApi({
      publicProps: async () => {
        return [[], [4, 'hash', 'Alice']];
      },
      electionRounds: async () => '5',
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
        }
        throw new Error('bad referendum idx');
      },
      getBlockHash: async () => {
        return 2;
      },
      'currentIndex.at': async () => new BN(12),
    });

    // run test
    const processor = new Processor(api);
    Promise.all(fakeBlocks.map((block) => processor.process(block)))
      .then((results) => {
        assert.equal(processor.lastBlockNumber, 2);
        assert.deepEqual(results[0], [
          {
            /* eslint-disable dot-notation */
            data: {
              kind: EventKind.Slash,
              validator: 'Alice',
              amount: '10000',
            } as ISlash,
            blockNumber: 1,
            network: SupportedNetwork.Substrate,
            includeAddresses: ['Alice'],
          },
          {
            data: {
              kind: EventKind.DemocracyProposed,
              proposalIndex: 4,
              proposalHash: 'hash',
              deposit: '100000',
              proposer: 'Alice',
            },
            excludeAddresses: ['Alice'],
            blockNumber: 1,
            network: SupportedNetwork.Substrate,
          },
        ]);
        assert.deepEqual(results[1], [
          {
            data: {
              kind: EventKind.DemocracyStarted,
              referendumIndex: 5,
              proposalHash: 'hash',
              voteThreshold: 'Supermajorityapproval',
              endBlock: 123,
            },
            blockNumber: 2,
            network: SupportedNetwork.Substrate,
          },
          {
            data: {
              kind: EventKind.ElectionCandidacySubmitted,
              candidate: 'Alice',
              round: 5,
            },
            blockNumber: 2,
            excludeAddresses: ['Alice'],
            network: SupportedNetwork.Substrate,
          },
        ]);
        done();
      })
      .catch((err) => done(err));
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
        data: ['Alice', '10000'],
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
    const fakeEvents: IFakeEvent[] = [
      {
        section: 'system',
        method: 'ExtrinsicSuccess',
        data: [],
        phase: {
          isApplyExtrinsic: true,
          asApplyExtrinsic: 0,
        },
      },
    ];
    const fakeExtrinsics = [
      {
        method: {
          section: 'elections',
          method: 'submitBetterCandidacy',
          args: [],
        },
        signer: 'Alice',
        data: new Uint8Array(),
      },
    ];

    const block = constructFakeBlock(1, fakeEvents, fakeExtrinsics);
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
        data: ['Alice', '10000'],
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
          unwrap: () => {
            throw new Error('no value');
          },
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
        data: ['Alice', '10000'],
      },
    ];

    const block = constructFakeBlock(1, fakeEvents);
    const api = constructFakeApi({});

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

  it('should ignore failed extrinsics', (done) => {
    // setup fake data
    const fakeEvents: IFakeEvent[] = [
      {
        section: 'system',
        method: 'ExtrinsicFailed',
        data: [],
        phase: {
          isApplyExtrinsic: true,
          asApplyExtrinsic: 0,
        },
      },
    ];

    const fakeExtrinsics = [
      {
        method: {
          section: 'elections',
          method: 'submitCandidacy',
          args: [],
        },
        signer: 'Alice',
        data: new Uint8Array(),
      },
    ];

    const block = constructFakeBlock(1, fakeEvents, fakeExtrinsics);
    const api = constructFakeApi({});

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

  it('should ignore extrinsics with no success or failed events', (done) => {
    // setup fake data
    const fakeEvents: IFakeEvent[] = [];

    const fakeExtrinsics = [
      {
        method: {
          section: 'elections',
          method: 'submitCandidacy',
          args: [],
        },
        signer: 'Alice',
        data: new Uint8Array(),
      },
    ];

    const block = constructFakeBlock(1, fakeEvents, fakeExtrinsics);
    const api = constructFakeApi({});

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
