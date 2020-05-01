import chai from 'chai';
import { Hash, EventRecord, RuntimeVersion } from '@polkadot/types/interfaces';

import { constructFakeApi } from './testUtil';
import Subscriber from '../../../../shared/events/edgeware/subscriber';

const { assert } = chai;

const hashes = [1 as unknown as Hash, 2 as unknown as Hash];
const events = [
  [{ event: { data: [1] } }] as unknown as EventRecord[],
  [{ event: { data: [2] } }, { event: { data: [3, 4] } }] as unknown as EventRecord[],
];

const getApi = () => {
  return constructFakeApi({
    subscribeNewHeads: (callback) => {
      callback({ hash: hashes[0], number: '1' });
      const handle = setTimeout(() => callback({ hash: hashes[1], number: '2' }), 50);
      return () => clearInterval(handle); // unsubscribe
    },
    'events.at': (hash) => {
      if (hash === hashes[0]) return events[0];
      if (hash === hashes[1]) return events[1];
      assert.fail('events.at called with invalid hash');
    },
    getBlock: (hash) => {
      return {
        block: {
          extrinsics: [],
        }
      };
    },
    subscribeRuntimeVersion: (callback) => {
      callback({ specVersion: 10, specName: 'edgeware' } as unknown as RuntimeVersion);
    }
  });
};

/* eslint-disable: dot-notation */
describe('Edgeware Event Subscriber Tests', () => {
  it('should callback with block data', (done) => {
    // setup mock data
    const api = getApi();

    // setup test class
    const subscriber = new Subscriber(api);

    // confirm unsubscribe is no-op
    subscriber.unsubscribe();

    // run test
    let seenBlocks = 0;
    subscriber.subscribe(
      (block) => {
        try {
          if (seenBlocks === 0) {
            // first block
            assert.deepEqual(block.header.hash, hashes[0]);
            assert.equal(+block.header.number, 1);
            assert.lengthOf(block.events, 1);
            assert.deepEqual(block.events[0], events[0][0]);
            assert.equal(block.versionNumber, 10);
            assert.equal(block.versionName, 'edgeware');
          } else if (seenBlocks === 1) {
            // second block
            assert.deepEqual(block.header.hash, hashes[1]);
            assert.equal(+block.header.number, 2);
            assert.lengthOf(block.events, 2);
            assert.deepEqual(block.events[0], events[1][0]);
            assert.deepEqual(block.events[1], events[1][1]);
            assert.equal(block.versionNumber, 10);
            assert.equal(block.versionName, 'edgeware');
          } else {
            assert.fail('invalid hash');
          }
          seenBlocks++;
          if (seenBlocks === 2) {
            done();
          }
        } catch (err) {
          done(err);
        }
      }
    );
  });

  it('should unsubscribe', (done) => {
    // setup mock data
    const api = getApi();

    // setup test class
    const subscriber = new Subscriber(api);

    // run test
    let seenBlocks = 0;
    subscriber.subscribe(
      (block) => {
        try {
          if (seenBlocks === 0) {
            // first block
            assert.deepEqual(block.header.hash, hashes[0]);
            assert.equal(+block.header.number, 1);
            assert.lengthOf(block.events, 1);
            assert.deepEqual(block.events[0], events[0][0]);
            assert.equal(block.versionNumber, 10);
            assert.equal(block.versionName, 'edgeware');
          } else if (seenBlocks === 1) {
            // second block
            assert.fail('should only process one block');
          } else {
            assert.fail('invalid hash');
          }
          seenBlocks++;
        } catch (err) {
          done(err);
        }
      }
    );
    setTimeout(() => {
      subscriber.unsubscribe();
      setTimeout(() => done(), 50);
    }, 10);
  });
  // TODO: fail tests
});
