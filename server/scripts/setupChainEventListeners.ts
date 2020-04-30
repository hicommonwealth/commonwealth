import WebSocket from 'ws';
import EdgewareNotificationHandler from '../eventHandlers/edgeware/notifications';
import EdgewareArchivalHandler from '../eventHandlers/edgeware/archival';
import subscribeEdgewareEvents from '../../shared/events/edgeware/index';
import { IDisconnectedRange, EventSupportingChains } from '../../shared/events/interfaces';

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
  if (lastChainEvent && lastChainEvent.length > 0 && lastChainEvent[0]) {
    const lastEventBlockNumber = lastChainEvent[0].block_number;
    console.log(`Discovered chain event in db at block ${lastEventBlockNumber}.`);
    return { startBlock: lastEventBlockNumber + 1 };
  } else {
    return { startBlock: null };
  }
};

const setupChainEventListeners = async (models, wss: WebSocket.Server, skipCatchup = false, migrate = false) => {
  console.log('Fetching node urls...');
  const nodes = await models.ChainNode.findAll();
  console.log('Setting up event listeners...');
  nodes.filter((node) => EventSupportingChains.includes(node.chain))
    .map(async (node) => {
      const notificationHandler = new EdgewareNotificationHandler(models, wss, node.chain);
      const archivalHandler = new EdgewareArchivalHandler(models, wss, node.chain);
      let url = node.url.substr(0, 2) === 'ws' ? node.url : `ws://${node.url}`;
      url = (url.indexOf(':9944') !== -1) ? url : `${url}:9944`;
      const subscriber = await subscribeEdgewareEvents(
        url,
        [ notificationHandler, archivalHandler ],
        skipCatchup,
        () => discoverReconnectRange(models, node.chain),
        migrate,
      );

      // hook for clean exit
      process.on('SIGTERM', () => {
        if (subscriber) {
          subscriber.unsubscribe();
        }
      });
      return subscriber;
    });
};

export default setupChainEventListeners;
