import { EventEmitter } from 'events';

import chai from 'chai';

import { Subscriber } from '../../../src/chains/aave/subscriber';
import type { Api, RawEvent } from '../../../src/chains/aave/types';

const { assert } = chai;

const constructEvent = (data): RawEvent => {
  return {
    args: data,
  } as RawEvent;
};

describe('Aave Event Subscriber Tests', () => {
  it('should callback with event data', async (done) => {
    const aaveApi = { governance: new EventEmitter() };
    const subscriber = new Subscriber(aaveApi as unknown as Api, 'aave-test');
    const id = 5;
    const executionTime = 100;
    const event = constructEvent({ id, executionTime });
    event.name = 'ProposalQueued';
    event.blockNumber = 10;
    const cb = (receivedEvent: RawEvent) => {
      assert.deepEqual(event, receivedEvent);
    };
    subscriber.subscribe(cb, {}).then(() => {
      aaveApi.governance.emit('*', event);
    });
    done();
  });

  it('should no-op on unnecessary unsubscribe', (done) => {
    const aaveApi = { governance: new EventEmitter() };
    const subscriber = new Subscriber(aaveApi as unknown as Api, 'aave-test');
    subscriber.unsubscribe();
    done();
  });

  it('should unsubscribe successfully', (done) => {
    const aaveApi = { governance: new EventEmitter() };
    const subscriber = new Subscriber(aaveApi as unknown as Api, 'aave-test');
    const cb = () => {
      assert.fail('should not reach callback');
    };
    subscriber.subscribe(cb, {}).then(() => {
      subscriber.unsubscribe();
      assert.deepEqual(aaveApi.governance.listeners('*'), []);
      done();
    });
  });
});
