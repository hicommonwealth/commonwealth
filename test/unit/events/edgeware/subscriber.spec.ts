import chai from 'chai';
import { Hash, EventRecord } from '@polkadot/types/interfaces';

import { constructFakeApi } from './testUtil';
import Subscriber from '../../../../server/events/edgeware/subscriber';

const { assert } = chai;

/* eslint-disable: dot-notation */
describe('Edgeware Subscriber Tests', () => {
  it('should callback with block data', (done) => {
    // setup mock data
    const hashes = [1 as unknown as Hash, 2 as unknown as Hash];
    const events = [
      [{ event: { data: [1] } }] as unknown as EventRecord[],
      [{ event: { data: [2] } }, { event: { data: [3, 4] } }] as unknown as EventRecord,
    ];
    const api = constructFakeApi({
      subscribeNewHeads: (callback) => {
        callback({ hash: hashes[0] });
        setTimeout(() => callback({ hash: hashes[1] }), 0);
      },
      'events.at': (hash) => {
        if (hash === hashes[0]) return events[0];
        if (hash === hashes[1]) return events[1];
        assert.fail('events.at called with invalid hash');
      }
    });

    // setup test class
    const subscriber = new Subscriber(api);

    // run test
    subscriber.subscribe(
      (block) => {
        try {
          if (block.header.hash === hashes[0]) {
            // first block
            assert.lengthOf(block.events, 1);
            assert.deepEqual(block.events[0], events[0][0]);
          } else if (block.header.hash === hashes[1]) {
            // second block
            assert.lengthOf(block.events, 2);
            assert.deepEqual(block.events[0], events[1][0]);
            assert.deepEqual(block.events[1], events[1][1]);
            done();
          } else {
            assert.fail('invalid hash');
          }
        } catch (err) {
          done(err);
        }
      }
    );
  });

  // TODO: fail tests
});
