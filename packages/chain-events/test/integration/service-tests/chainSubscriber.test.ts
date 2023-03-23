import {initSubscriberTools, processChains} from "../../../services/ChainSubscriber/chainSubscriber";

describe('Tests for the ChainSubscriber service', () => {
  before(async () => {

  });
  describe('Tests Compound Bravo Event Listeners', () => {
    before(async () => {
      // set up the chain subscriber
      const  {rollbar, pool, producer} = await initSubscriberTools();
      await processChains(producer, pool, null, 'dydx')
    });
    it('Should capture proposal created events');
    it('Should capture votes on the created proposal');
    it('Should capture delegation events');
  })
})
