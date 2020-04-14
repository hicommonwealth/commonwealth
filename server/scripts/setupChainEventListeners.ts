import EdgewareEventHandler from '../eventHandlers/edgeware';
import subscribeEdgewareEvents from '../../shared/events/edgeware/index';
import { IDisconnectedRange } from '../../shared/events/interfaces';

const discoverReconnectRange = async (models, chain: string): Promise<IDisconnectedRange> => {
  const lastChainEvent = await models.ChainEvent.findAll({
    limit: 1,
    order: [ [ 'created_at', 'DESC' ]],
    // this $...$ queries the data inside the include (ChainEvents don't have `chain` but ChainEventTypes do)...
    // we might be able to replicate this behavior with where and required: true inside the include
    where: {
      '$ChainEventType.chain$': chain,
    },
    include: [
      { model: models.ChainEventType }
    ]
  });
  if (lastChainEvent) {
    const lastEventBlockNumber = lastChainEvent[0].block_number;
    console.log(`Discovered chain event in db at block ${lastEventBlockNumber}.`);
    return { startBlock: lastEventBlockNumber + 1 };
  } else {
    return { startBlock: null };
  }
};

const setupChainEventListeners = async (models, wss, skipCatchup = false) => {
  // TODO: add a flag to the db for this filter, but for now
  //    just take edgeware and edgeware-local
  console.log('Fetching node urls...');
  const nodes = await models.ChainNode.findAll();
  console.log('Setting up event listeners...');
  nodes.filter((node) => node.chain === 'edgeware' || node.chain === 'edgeware-local')
    .map(async (node) => {
      const eventHandler = new EdgewareEventHandler(models, wss, node.chain);
      const url = `ws://${node.url}`;
      const subscriber = await subscribeEdgewareEvents(
        url,
        eventHandler,
        skipCatchup,
        () => discoverReconnectRange(models, node.chain),
      );

      // hook for clean exit
      process.on('SIGTERM', () => {
        subscriber.unsubscribe();
      });
      // TODO: how to handle error cases?
      return subscriber;
    });
};

export default setupChainEventListeners;
