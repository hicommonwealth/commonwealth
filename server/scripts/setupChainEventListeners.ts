import EdgewareEventHandler from '../eventHandlers/edgeware';
import subscribeEdgewareEvents from '../../shared/events/edgeware/index';

const setupChainEventListeners = async (models, wss) => {
  // TODO: add a flag to the db for this filter, but for now
  //    just take edgeware and edgeware-local
  const nodes = await models.ChainNode.findAll();
  nodes.filter((node) => node.chain === 'edgeware' || node.chain === 'edgeware-local')
    .map(async (node) => {
      const eventHandler = new EdgewareEventHandler(models, wss, node.chain);
      const url = `ws://${node.url}`;
      const subscriber = await subscribeEdgewareEvents(url, eventHandler);

      // hook for clean exit
      process.on('SIGTERM', () => {
        subscriber.unsubscribe();
      });
      // TODO: how to handle error cases?
      return subscriber;
    });
};

export default setupChainEventListeners;
