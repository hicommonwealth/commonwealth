import * as events from 'events';

import * as chai from 'chai';
import dotenv from 'dotenv';

import {
  Processor,
  StorageFetcher,
  Subscriber,
  Listener,
} from '../../../src/chain-bases/EVM/aave';
import { networkUrls, contracts } from '../../../scripts/listenerUtils';
import { TestHandler } from '../../util';

dotenv.config();

const { assert } = chai;

describe.skip('Aave listener class tests', () => {
  let listener;
  const handlerEmitter = new events.EventEmitter();

  it('should create an Aave listener', () => {
    listener = new Listener('aave', contracts.aave, null, true, false);
    assert.equal(listener.chain, 'aave');
    assert.deepEqual(listener.options, {
      url: networkUrls.aave,
      skipCatchup: true,
      govContractAddress: contracts.aave,
    });
    assert.equal(listener.subscribed, false);
    assert.equal(listener._verbose, false);
  });

  it('should initialize the Aave listener', async () => {
    listener = new Listener('aave', contracts.aave, null, true, false);
    await listener.init();
    assert(listener._subscriber instanceof Subscriber);
    assert(listener.storageFetcher instanceof StorageFetcher);
    assert(listener._processor instanceof Processor);
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
      const startBlock = 9786650;

      listener.storageFetcher.fetch({ startBlock }).then((es) => {
        if (es.length > 0) done();
        else assert.fail('No event received and storage handler failed');
      });
    }, 10000);

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

  xit('should update the contract address');

  xit('should verify that the handler handled an event successfully after changing contract address', (done) => {
    listener.eventHandlers.TestHandler.handler.counter = 0;
    let counter = 0;
    const verifyHandler = () => {
      assert(listener.eventHandlers.TestHandler.handler.counter >= 1);
      ++counter;
      if (counter === 1) done();
    };
    handlerEmitter.on('eventHandled', verifyHandler);
  }).timeout(20000);

  xit('should verify that the handler handled an event successfully after changing urls', () => {
    assert(
      listener.eventHandlers.TestHandler.handler.counter >= 1,
      'Handler was not triggered/used'
    );
    listener.eventHandlers.TestHandler.handler.counter = 0;
  });

  it('should unsubscribe from the chain', async () => {
    listener.unsubscribe();
    assert.equal(listener.subscribed, false);
  });

  it('should return the updated options', async () => {
    assert.deepEqual(listener.options, {
      url: networkUrls.aave,
      skipCatchup: true,
      govContractAddress: contracts.aave,
    });
  });
});
