import chai from 'chai';
import { Hash, EventRecord, Header, RuntimeVersion } from '@polkadot/types/interfaces';

import { constructFakeApi } from './testUtil';
import Poller from '../../../../shared/events/edgeware/poller';

const { assert } = chai;

// we need a number that implements "isEmpty" when 0, to align with
// the Substrate Hash's interface
class IMockHash extends Number {
  get isEmpty(): boolean {
    return this.valueOf() === 0;
  }
}

const hashNums: number[] = [...Array(10).keys()].map((i) => i < 5 ? 0 : i);
const hashes = hashNums.map((n) => new IMockHash(n)) as unknown as Hash[];
const headers: Header[] = hashNums.map((hash) => {
  if (hash === 0) {
    return undefined;
  } else {
    return {
      parentHash: (hash - 1),
      number: 100 + hash,
      hash,
    } as unknown as Header;
  }
});

const events = {
  6: [{ event: { data: [1] } }] as unknown as EventRecord[],
  8: [{ event: { data: [2] } }, { event: { data: [3, 4] } }] as unknown as EventRecord[],
};

const getMockApi = () => {
  return constructFakeApi({
    getHeader: (hash?: Hash) => {
      if (hash === undefined) {
        hash = hashes[hashes.length - 1];
      }
      return headers[hash as unknown as number];
    },
    'events.at': (hash: Hash) => {
      return events[hash as unknown as number] || [];
    },
    'blockHash.multi': (blockNumbers: number[]) => {
      return blockNumbers.map((n) => {
        // fake a few values to test the size reduction actually works
        if (n === 2600 || n === 2400) {
          return hashes[5];
        }
        if (n >= 100 && n <= 110) {
          return hashes[n - 100];
        } else {
          return new IMockHash(0);
        }
      });
    },
    getBlock: (hash) => {
      return {
        block: {
          extrinsics: [],
        }
      };
    },
    getRuntimeVersion: () => {
      return {
        specVersion: 10,
        specName: 'edgeware',
      } as unknown as RuntimeVersion;
    }
  });
};

/* eslint-disable: dot-notation */
describe('Edgeware Event Poller Tests', () => {
  it('should return block data', async () => {
    // setup mock data
    const api = getMockApi();

    // setup test class
    const poller = new Poller(api);

    // run test
    const blocks = await poller.poll({ startBlock: 105, endBlock: 108 });
    assert.lengthOf(blocks, 3);
    assert.equal(+blocks[0].header.number, 105);
    assert.deepEqual(blocks[0].events, []);
    assert.equal(blocks[0].versionNumber, 10);
    assert.equal(blocks[0].versionName, 'edgeware');
    assert.equal(+blocks[1].header.number, 106);
    assert.deepEqual(blocks[1].events, events[6]);
    assert.equal(blocks[1].versionNumber, 10);
    assert.equal(blocks[1].versionName, 'edgeware');
    assert.equal(+blocks[2].header.number, 107);
    assert.deepEqual(blocks[2].events, []);
    assert.equal(blocks[2].versionNumber, 10);
    assert.equal(blocks[2].versionName, 'edgeware');
  });

  it('should skip zeroed hashes', async () => {
    // setup mock data
    const api = getMockApi();

    // setup test class
    const poller = new Poller(api);

    // run test
    const blocks = await poller.poll({ startBlock: 101, endBlock: 106 });
    assert.lengthOf(blocks, 1);
    assert.equal(+blocks[0].header.number, 105);
    assert.deepEqual(blocks[0].events, []);
    assert.equal(blocks[0].versionNumber, 10);
    assert.equal(blocks[0].versionName, 'edgeware');
  });


  it('should derive endblock from header', async () => {
    // setup mock data
    const api = getMockApi();

    // setup test class
    const poller = new Poller(api);

    // run test
    const blocks = await poller.poll({ startBlock: 107 });
    assert.lengthOf(blocks, 2);
    assert.equal(+blocks[0].header.number, 107);
    assert.deepEqual(blocks[0].events, []);
    assert.equal(blocks[0].versionNumber, 10);
    assert.equal(blocks[0].versionName, 'edgeware');
    assert.equal(+blocks[1].header.number, 108);
    assert.deepEqual(blocks[1].events, events[8]);
    assert.equal(blocks[1].versionNumber, 10);
    assert.equal(blocks[1].versionName, 'edgeware');
  });

  it('should not accept invalid start/end blocks', async () => {
    // setup mock data
    const api = getMockApi();

    // setup test class
    const poller = new Poller(api);

    assert.isUndefined(await poller.poll({
      startBlock: 111,
    }));
    assert.isUndefined(await poller.poll({
      startBlock: 100,
      endBlock: 99,
    }));
  });

  it('should reduce size of range if too large', async () => {
    // setup mock data
    const api = getMockApi();

    // setup test class
    const poller = new Poller(api);

    // run test
    const blocks = await poller.poll({ startBlock: 100, endBlock: 3000 });
    assert.lengthOf(blocks, 1);
    assert.equal(+blocks[0].header.number, 105);
    assert.deepEqual(blocks[0].events, []);
    assert.equal(blocks[0].versionNumber, 10);
    assert.equal(blocks[0].versionName, 'edgeware');
  });
});
