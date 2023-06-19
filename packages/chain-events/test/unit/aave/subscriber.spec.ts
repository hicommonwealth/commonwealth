import { EventEmitter } from 'events';

import chai from 'chai';

import { Subscriber } from '../../../src/chains/EVM/subscriber';
import type { RawEvent } from '../../../src/chains/aave/types';
import { ethers } from 'ethers';

const { assert } = chai;

const constructEvent = (data): RawEvent => {
  return {
    args: data,
  } as RawEvent;
};

describe('Aave Event Subscriber Tests', () => {
  const aaveApi = {
    governance: {
      event: new EventEmitter(),
      provider: new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545'),
    },
  };
  const randomAddress = ['0x1234'];

  it('should callback with event data', async (done) => {
    const subscriber = new Subscriber(
      aaveApi.governance.provider,
      'aave-test',
      randomAddress
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
      aaveApi.governance.event.emit('*', event);
    });
    done();
  });

  it('should no-op on unnecessary unsubscribe', (done) => {
    const subscriber = new Subscriber(
      aaveApi.governance.provider,
      'aave-test',
      randomAddress
    );
    subscriber.unsubscribe();
    done();
  });

  it('should unsubscribe successfully', (done) => {
    const subscriber = new Subscriber(
      aaveApi.governance.provider,
      'aave-test',
      randomAddress
    );
    const cb = () => {
      assert.fail('should not reach callback');
    };
    subscriber.subscribe(cb, {}).then(() => {
      subscriber.unsubscribe();
      assert.deepEqual(aaveApi.governance.event.listeners('*'), []);
      done();
    });
  });
});
