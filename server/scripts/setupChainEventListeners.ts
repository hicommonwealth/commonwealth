import WebSocket from 'ws';
import EventStorageHandler from '../eventHandlers/storage';
import EventNotificationHandler from '../eventHandlers/notifications';
import EdgewareMigrationHandler from '../eventHandlers/edgeware/migration';
import EdgewareEntityArchivalHandler from '../eventHandlers/edgeware/entityArchival';
import subscribeEdgewareEvents from '../../shared/events/edgeware/index';
import { IDisconnectedRange, EventSupportingChains, IEventHandler } from '../../shared/events/interfaces';

import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

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
    log.info(`Discovered chain event in db at block ${lastEventBlockNumber}.`);
    return { startBlock: lastEventBlockNumber + 1 };
  } else {
    return { startBlock: null };
  }
};

const setupChainEventListeners = async (models, wss: WebSocket.Server, skipCatchup = false, migrate = false) => {
  log.info('Fetching node urls...');
  const nodes = await models.ChainNode.findAll();
  log.info('Setting up event listeners...');
  await Promise.all(nodes
    .filter((node) => EventSupportingChains.includes(node.chain))
    // filter out duplicate nods per-chain, only use one node
    .filter((node) => nodes.map((n) => n.chain).indexOf(node.chain) === nodes.indexOf(node))
    .map(async (node) => {
      const handlers: IEventHandler[] = [];
      if (migrate) {
        const migrationHandler = new EdgewareMigrationHandler(models, node.chain);
        const entityArchivalHandler = new EdgewareEntityArchivalHandler(models, node.chain);
        handlers.push(migrationHandler, entityArchivalHandler);
      } else {
        const storageHandler = new EventStorageHandler(models, node.chain);
        const notificationHandler = new EventNotificationHandler(models, wss);
        const entityArchivalHandler = new EdgewareEntityArchivalHandler(models, node.chain, wss);
        handlers.push(storageHandler, notificationHandler, entityArchivalHandler);
      }
      let url: string = node.url;
      if (url.indexOf('edgewa.re') !== -1) {
        // must be ws
        const urlNoProtocol = url.replace(/ws?s:\/\//, '');
        url = `ws://${urlNoProtocol}`;
      } else if (url.indexOf('kusama') !== -1) {
        // requires wss and no port
        const urlPath = url.replace(/^ws?s:\/\//, '').replace(/:[0-9]*$/, '');
        url = `wss://${urlPath}`;
      }
      const subscriber = await subscribeEdgewareEvents(
        node.chain,
        url,
        handlers,
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
    }));
};

export default setupChainEventListeners;
