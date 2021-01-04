import { EventEmitter } from 'events';
import chai from 'chai';

import { Subscriber } from '../../../src/marlin/subscriber';
import { Api, RawEvent } from '../../../src/marlin/types';

const { assert } = chai;

const toHex = (n: number | string) => ({ _hex: `0x${n.toString(16)}` });

const constructEvent = (data: object, section = '', typeDef: string[] = []): RawEvent => {
  return {
    args: data,
  } as RawEvent;
};

describe('Marlin Event Subscriber Tests', () => {
  it('should callback with event data', async (done) => {
    const marlinApi = {
      comp: new EventEmitter(),
      governorAlpha: new EventEmitter(),
      timelock: new EventEmitter(),
    }
    const subscriber = new Subscriber(marlinApi as unknown as Api, 'marlin-test');
    const fromDelegate = 'previousAddress';
    const toDelegate = 'toAddress';
    const delegator = 'fromAddress';
    const event = constructEvent({
      delegator,
      toDelegate,
      fromDelegate,
    });
    event.event = 'DelegateChanged';
    event.blockNumber = 10;
    const cb = (receivedEvent: RawEvent) => {
      assert.deepEqual(event, receivedEvent);
    };
    subscriber.subscribe(cb).then(() => {
      marlinApi.comp.emit('*', event);
    });
    done();
  });

  it('should no-op on unnecessary unsubscribe', (done) => {
    const marlinApi = new EventEmitter();
    const subscriber = new Subscriber(marlinApi as unknown as Api, 'marlin-test');
    subscriber.unsubscribe();
    done();
  });

  it('should unsubscribe successfully', (done) => {
    const marlinApi = {
      comp: new EventEmitter(),
      governorAlpha: new EventEmitter(),
      timelock: new EventEmitter(),
    };
    const subscriber = new Subscriber(marlinApi as unknown as Api, 'marlin-test');
    const cb = (receivedEvent: RawEvent) => {
      assert.fail('should not reach callback');
    };
    subscriber.subscribe(cb).then(() => {
      subscriber.unsubscribe();
      assert.deepEqual(marlinApi.comp.listeners('*'), []);
      assert.deepEqual(marlinApi.governorAlpha.listeners('*'), []);
      assert.deepEqual(marlinApi.timelock.listeners('*'), []);
      done();
    })
  });
});