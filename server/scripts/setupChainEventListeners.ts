import WebSocket from 'ws';
import _ from 'underscore';
import {
  IDisconnectedRange, IEventHandler, EventSupportingChains, IEventSubscriber,
  SubstrateTypes, SubstrateEvents, MolochTypes, MolochEvents
} from '@commonwealth/chain-events';

import EventStorageHandler from '../eventHandlers/storage';
import EventNotificationHandler from '../eventHandlers/notifications';
import MigrationHandler from '../eventHandlers/migration';
import EntityArchivalHandler from '../eventHandlers/entityArchival';
import IdentityHandler from '../eventHandlers/identity';

import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

const discoverReconnectRange = async (models, chain: string): Promise<IDisconnectedRange> => {
  const lastChainEvent = await models.ChainEvent.findAll({
    limit: 1,
    order: [ [ 'block_number', 'DESC' ]],
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

const setupChainEventListeners = async (
  models, wss: WebSocket.Server, skipCatchup?: boolean, migrate?: string
): Promise<{ [chain: string]: IEventSubscriber<any, any> }> => {
  log.info('Fetching node urls...');
  const nodes = await models.ChainNode.findAll();
  log.info('Setting up event listeners...');
  const subscribers: [string, IEventSubscriber<any, any>][] = await Promise.all(nodes
    .filter((node) => EventSupportingChains.includes(node.chain))
    // filter out duplicate nods per-chain, only use one node
    .filter((node) => nodes.map((n) => n.chain).indexOf(node.chain) === nodes.indexOf(node))
    // if migrating, only use chain specified, unless "all"
    .filter((node) => (!migrate || migrate === 'all') ? true : node.chain === migrate)
    .map(async (node) => {
      const handlers: IEventHandler[] = [];
      const storageHandler = new EventStorageHandler(models, node.chain);
      const notificationHandler = new EventNotificationHandler(models, wss);
      const migrationHandler = new MigrationHandler(models, node.chain);
      const entityArchivalHandler = new EntityArchivalHandler(models, node.chain, !migrate ? wss : undefined);
      const identityHandler = new IdentityHandler(models, node.chain);

      // handlers are run in order, so if migrating, we run migration -> entityArchival,
      // but normally it's storage -> notification -> entityArchival
      if (migrate) {
        handlers.push(migrationHandler, entityArchivalHandler);
      } else {
        handlers.push(storageHandler, notificationHandler, entityArchivalHandler);
      }
      let subscriber: IEventSubscriber<any, any>;
      if (SubstrateTypes.EventChains.includes(node.chain)) {
        // only handle identities on substrate chains
        if (!migrate) {
          handlers.push(identityHandler);
        }

        let nodeUrl = node.url;
        const hasProtocol = nodeUrl.indexOf('wss://') !== -1 || nodeUrl.indexOf('ws://') !== -1;
        nodeUrl = hasProtocol ? nodeUrl.split('://')[1] : nodeUrl;
        const isInsecureProtocol = nodeUrl.indexOf('kusama-rpc.polkadot.io') === -1
          && nodeUrl.indexOf('rpc.polkadot.io') === -1;
        const protocol = isInsecureProtocol ? 'ws://' : 'wss://';
        if (nodeUrl.indexOf(':9944') !== -1) {
          nodeUrl = isInsecureProtocol ? nodeUrl : nodeUrl.split(':9944')[0];
        }
        nodeUrl = protocol + nodeUrl;
        const provider = await SubstrateEvents.createProvider(nodeUrl);
        const api = await SubstrateEvents.createApi(provider, node.chain).isReady;
        subscriber = await SubstrateEvents.subscribeEvents({
          chain: node.chain,
          handlers,
          skipCatchup,
          discoverReconnectRange: () => discoverReconnectRange(models, node.chain),
          performMigration: !!migrate,
          api,
        });
      } else if (MolochTypes.EventChains.includes(node.chain)) {
        const contractVersion = 1;
        const api = await MolochEvents.createApi(node.url, contractVersion, node.address);
        subscriber = await MolochEvents.subscribeEvents({
          chain: node.chain,
          handlers,
          skipCatchup,
          discoverReconnectRange: () => discoverReconnectRange(models, node.chain),
          api,
          contractVersion,
        });
      }

      // hook for clean exit
      process.on('SIGTERM', () => {
        if (subscriber) {
          subscriber.unsubscribe();
        }
      });
      return [ node.chain, subscriber ];
    }));
  return _.object(subscribers);
};

export default setupChainEventListeners;
