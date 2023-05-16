import * as events from 'events';

import * as chai from 'chai';
import dotenv from 'dotenv';

import {
  Processor,
  Subscriber,
  Listener,
} from '../../../src/chain-bases/EVM/erc20';
import { networkUrls } from '../../../scripts/listenerUtils';
import { TestHandler } from '../../util';

dotenv.config();

const { assert } = chai;
const tokenAddresses = [
  '0xdac17f958d2ee523a2206206994597c13d831ec7',
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
];
const tokenNames = ['USDT', 'USDC'];

describe.skip('Erc20 listener class tests', () => {
  let listener;
  const handlerEmitter = new events.EventEmitter();

  it('should create an Erc20 listener', () => {
    listener = new Listener(
      'erc20',
      tokenAddresses,
      networkUrls.erc20,
      tokenNames,
      {}
    );
    assert.equal(listener.chain, 'erc20');
    assert.deepEqual(listener.options, {
      url: networkUrls.erc20,
      tokenAddresses,
      tokenNames,
    });
    assert.equal(listener.subscribed, false);
    assert.equal(listener._verbose, false);
  });

  it('should initialize the Erc20 listener', async () => {
    await listener.init();
    assert(listener._subscriber instanceof Subscriber);
    assert(listener._processor instanceof Processor);
  });

  it('should add a handler', async () => {
    listener.eventHandlers.TestHandler = {
      handler: new TestHandler(listener._verbose, handlerEmitter),
      excludedEvents: [],
    };

    assert(listener.eventHandlers.TestHandler.handler instanceof TestHandler);
  });

  it('should subscribe the listener to the specified erc20 tokens', async () => {
    await listener.subscribe();
    assert.equal(listener.subscribed, true);
  });

  it('should verify that the handler handled an event successfully', (done) => {
    let counter = 0;
    const verifyHandler = () => {
      assert(listener.eventHandlers.TestHandler.handler.counter >= 1);
      ++counter;
      if (counter === 1) {
        done();
      }
    };
    handlerEmitter.on('eventHandled', verifyHandler);
  }).timeout(50000);

  xit('should update a contract address');

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

  xit('should update the url the listener should connect to', async () =>
    undefined);

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
      url: networkUrls.erc20,
      tokenAddresses,
      tokenNames,
    });
  });
});
