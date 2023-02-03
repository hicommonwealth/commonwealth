import chai from 'chai';
import { setupChainEventConsumer } from 'chain-events/services/ChainEventsConsumer/chainEventsConsumer';
import { chainEventsSubscriberInitializer } from 'chain-events/services/ChainSubscriber/chainSubscriber';
import { setupCommonwealthConsumer } from '../../server/CommonwealthConsumer/CommonwealthConsumer';

const { expect } = chai;

/**
 * Working on a good way to test the ChainEventsSubscriber using a local chain.
 * Once that is figured out these tests can move forward.
 */
xdescribe('Tests for the whole chain-event and commonwealth system', () => {
  xit('Should take a message from the CE subscriber all the way to the CW Consumer', async () => {
    await setupCommonwealthConsumer();
    await setupChainEventConsumer();
    await chainEventsSubscriberInitializer();
  });
});
