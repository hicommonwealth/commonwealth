import { EventEmitter } from 'events';

import chai from 'chai';

import { Subscriber } from '../../../src/chains/compound/subscriber';
import type { Api, RawEvent } from '../../../src/chains/compound/types';

const { assert } = chai;

const constructEvent = (data): RawEvent => {
  return {
    args: data,
  } as RawEvent;
};

describe('Compound Event Subscriber Tests', () => {
  it('should callback with event data', async (done) => {
    const compoundApi = new EventEmitter();
    const subscriber = new Subscriber(
      compoundApi as unknown as Api,
      'compound-test'
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
      compoundApi.emit('*', event);
    });
    done();
  });

  it('should no-op on unnecessary unsubscribe', (done) => {
    const compoundApi = new EventEmitter();
    const subscriber = new Subscriber(
      compoundApi as unknown as Api,
      'compound-test'
    );
    subscriber.unsubscribe();
    done();
  });

  it('should unsubscribe successfully', (done) => {
    const compoundApi = new EventEmitter();
    const subscriber = new Subscriber(
      compoundApi as unknown as Api,
      'compound-test'
    );
    const cb = () => {
      assert.fail('should not reach callback');
    };
    subscriber.subscribe(cb, {}).then(() => {
      subscriber.unsubscribe();
      assert.deepEqual(compoundApi.listeners('*'), []);
      done();
    });
  });
});
