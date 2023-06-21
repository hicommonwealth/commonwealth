import { EventEmitter } from 'events';

import chai from 'chai';

import { Subscriber } from '../../../src/chains/EVM/subscriber';
import type { RawEvent } from '../../../src/chains/compound/types';
import { ethers } from 'ethers';
import { LastCachedBlockNumber } from '../../../src/LastCachedBlockNumber';

const { assert } = chai;

const constructEvent = (data): RawEvent => {
  return {
    args: data,
  } as RawEvent;
};

const lastCachedBlockNumber = new LastCachedBlockNumber();

describe('Compound Event Subscriber Tests', () => {
  const randomAddress = ['0x1234'];
  const compoundApi = {
    event: new EventEmitter(),
    provider: new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545'),
  };

  it('should callback with event data', async (done) => {
    const subscriber = new Subscriber(
      compoundApi.provider,
      'compound-test',
      randomAddress,
      lastCachedBlockNumber
    );
    const id = 5;
    const executionTime = 100;
    const event = constructEvent({ id, executionTime });
    event.name = 'ProposalQueued';
    event.blockNumber = 10;
    const cb = (receivedEvent: RawEvent) => {
      assert.deepEqual(event, receivedEvent);
    };
    subscriber.subscribe(cb, {}).then(() => {
      compoundApi.event.emit('*', event);
    });
    done();
  });

  it('should no-op on unnecessary unsubscribe', (done) => {
    const subscriber = new Subscriber(
      compoundApi.provider,
      'compound-test',
      randomAddress,
      lastCachedBlockNumber
    );
    subscriber.unsubscribe();
    done();
  });

  it('should unsubscribe successfully', (done) => {
    const subscriber = new Subscriber(
      compoundApi.provider,
      'compound-test',
      randomAddress,
      lastCachedBlockNumber
    );
    const cb = () => {
      assert.fail('should not reach callback');
    };
    subscriber.subscribe(cb, {}).then(() => {
      subscriber.unsubscribe();
      assert.deepEqual(compoundApi.event.listeners('*'), []);
      done();
    });
  });
});
