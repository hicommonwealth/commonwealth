import * as events from 'events';

import * as chai from 'chai';
import { ApiPromise } from '@polkadot/api';

import {
  Poller,
  Processor,
  StorageFetcher,
  Subscriber,
  Listener,
} from 'chain-events/src/chain-bases/substrate';
import { networkUrls } from '../../../scripts/listenerUtils';
import { TestHandler } from '../../util';

const { assert } = chai;

describe.skip('Substrate listener class tests', () => {
  let listener;
  const handlerEmitter = new events.EventEmitter();

  it('should create the substrate listener', () => {
    listener = new Listener(
      'polkadot',
      networkUrls.polkadot,
      {},
      false,
      0,
      true,
      {},
      false
    );
    assert.equal(listener.chain, 'polkadot');
    assert.deepEqual(listener.options, {
      archival: false,
      startBlock: 0,
      url: networkUrls.polkadot,
      spec: {},
      skipCatchup: true,
      enricherConfig: {},
    });
    assert.equal(listener.subscribed, false);
    assert.equal(listener._verbose, false);
  });

  it('should initialize the substrate listener class', async () => {
    await listener.init();
    assert(
      listener._subscriber instanceof Subscriber,
      'Subscriber should be initialized'
    );
    assert(listener._poller instanceof Poller, 'Poller should be initialized');
    assert(
      listener.storageFetcher instanceof StorageFetcher,
      'StorageFetcher should be initialized'
    );
    assert(
      listener._processor instanceof Processor,
      'Processor should be initialized'
    );
    assert(listener._api instanceof ApiPromise, 'Api should be initialized');
  });

  it('should add a handler', async () => {
    listener.eventHandlers.TestHandler = {
      handler: new TestHandler(listener._verbose, handlerEmitter),
      excludedEvents: [],
    };

    assert(listener.eventHandlers.TestHandler.handler instanceof TestHandler);
  });

  it('should subscribe the listener to the specified chain', async () => {
    await listener.subscribe();
    assert.equal(listener.subscribed, true);
  });

  it('should verify that the handler handled an event successfully', (done) => {
    let counter = 0;

    // after 10 seconds with no event received use storage fetcher to verify api/connection
    const timeoutHandler = setTimeout(() => {
      // handlerEmitter.removeAllListeners();
      const startBlock = 6435620;

      listener.storageFetcher.fetch({ startBlock }).then((es) => {
        if (es.length > 0) done();
        else assert.fail('No event received and storage handler failed');
      });
    }, 20000);

    const verifyHandler = () => {
      assert(listener.eventHandlers.TestHandler.handler.counter >= 1);
      ++counter;
      if (counter === 1) {
        clearTimeout(timeoutHandler);
        done();
      }
    };
    handlerEmitter.on('eventHandled', verifyHandler);
  }).timeout(50000);

  it('should update the chain spec', async () => {
    await listener.updateSpec({ randomSpec: 0 });
    assert.deepEqual(listener._options.spec, { randomSpec: 0 });
  });

  it('should verify that the handler handled an event successfully after changing specs', (done) => {
    let counter = 0;
    // after 10 seconds with no event received use storage fetcher to verify api/connection
    const timeoutHandler = setTimeout(() => {
      // handlerEmitter.removeAllListeners();
      const startBlock = 6435620;

      listener.storageFetcher.fetch({ startBlock }).then((es) => {
        if (es.length > 0) done();
        else assert.fail('No event received and storage handler failed');
      });
    }, 20000);

    const verifyHandler = () => {
      assert(listener.eventHandlers.TestHandler.handler.counter >= 1);
      ++counter;
      if (counter === 1) {
        clearTimeout(timeoutHandler);
        done();
      }
    };
    handlerEmitter.on('eventHandled', verifyHandler);
  }).timeout(50000);

  xit('should verify that the handler handled an event successfully after changing urls', () => {
    assert(listener.eventHandlers.TestHandler.handler.counter >= 1);
    listener.eventHandlers.TestHandler.handler.counter = 0;
  });

  it('should unsubscribe from the chain', async () => {
    listener.unsubscribe();
    assert.equal(listener.subscribed, false);
  });

  it('should return the updated options', async () => {
    assert.deepEqual(listener.options, {
      archival: false,
      startBlock: 0,
      url: networkUrls.polkadot,
      spec: { randomSpec: 0 },
      skipCatchup: true,
      enricherConfig: {},
    });
  });
});
