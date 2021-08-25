import * as events from 'events';

import * as chai from 'chai';
import dotenv from 'dotenv';

import {
  Processor,
  StorageFetcher,
  Subscriber,
  Listener,
} from '../../../src/chains/compound';
import { networkUrls, EventSupportingChainT, contracts } from '../../../src';
import { testHandler } from '../../util';

dotenv.config();

const { assert } = chai;

describe('Compound listener class tests', () => {
  let listener;
  const handlerEmitter = new events.EventEmitter();

  it('should throw if the chain is not a Compound based chain', () => {
    try {
      new Listener('randomChain' as EventSupportingChainT, contracts.marlin);
    } catch (error) {
      assert(String(error).includes('randomChain'));
    }
  });

  it('should create a Compound listener', () => {
    listener = new Listener('marlin', contracts.marlin, null, true, false);
    assert.equal(listener.chain, 'marlin');
    assert.deepEqual(listener.options, {
      url: networkUrls.marlin,
      skipCatchup: true,
      contractAddress: contracts.marlin,
    });
    assert.equal(listener.subscribed, false);
    assert.equal(listener._verbose, false);
  });

  it('should initialize the Compound listener', async () => {
    await listener.init();
    assert(listener._subscriber instanceof Subscriber);
    assert(listener.storageFetcher instanceof StorageFetcher);
    assert(listener._processor instanceof Processor);
  });

  it('should add a handler', async () => {
    listener.eventHandlers.testHandler = {
      handler: new testHandler(listener._verbose, handlerEmitter),
      excludedEvents: [],
    };

    assert(listener.eventHandlers.testHandler.handler instanceof testHandler);
  });

  it('should subscribe the listener to the specified chain', async () => {
    await listener.subscribe();
    assert.equal(listener.subscribed, true);
  });

  it('should verify that the handler handled an event successfully', (done) => {
    let counter = 0;
    const verifyHandler = () => {
      assert(listener.eventHandlers.testHandler.handler.counter >= 1);
      ++counter;
      if (counter == 1) {
        clearTimeout(timeoutHandler);
        done();
      }
    };
    handlerEmitter.on('eventHandled', verifyHandler);

    // after 10 seconds with no event received use storage fetcher to verify api/connection
    const timeoutHandler = setTimeout(() => {
      // handlerEmitter.removeAllListeners();
      const startBlock = 9786650;

      listener.storageFetcher.fetch({ startBlock }).then((events) => {
        if (events.length > 0) done();
        else assert.fail('No event received and storage handler failed');
      });
    }, 10000);
  }).timeout(50000);

  xit('should update the contract address');

  xit('should verify that the handler handled an event successfully after changing contract address', (done) => {
    listener.eventHandlers.testHandler.handler.counter = 0;
    let counter = 0;
    const verifyHandler = () => {
      assert(listener.eventHandlers.testHandler.handler.counter >= 1);
      ++counter;
      if (counter == 1) done();
    };
    handlerEmitter.on('eventHandled', verifyHandler);
  }).timeout(20000);

  xit('should update the url the listener should connect to', async () => {});

  xit('should verify that the handler handled an event successfully after changing urls', () => {
    assert(
      listener.eventHandlers.testHandler.handler.counter >= 1,
      'Handler was not triggered/used'
    );
    listener.eventHandlers.testHandler.handler.counter = 0;
  });

  it('should unsubscribe from the chain', async () => {
    listener.unsubscribe();
    assert.equal(listener.subscribed, false);
  });

  it('should return the updated options', async () => {
    assert.deepEqual(listener.options, {
      url: networkUrls.marlin,
      skipCatchup: true,
      contractAddress: contracts.marlin,
    });
  });
});
