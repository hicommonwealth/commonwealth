import WebSocket from 'ws';
import subscribeSubstrateEvents, {
  createSubstrateProvider, createSubstrateApi
} from '@commonwealth/chain-events/dist/src/substrate/index';
import subscribeMolochEvents, { createMolochApi } from '@commonwealth/chain-events/dist/src/moloch/index';
import {
  IDisconnectedRange, IEventHandler, EventSupportingChains, IEventSubscriber
} from '@commonwealth/chain-events/dist/src/interfaces';
import { SubstrateEventChains } from '@commonwealth/chain-events/dist/src/substrate/types';
import { MolochEventChains } from '@commonwealth/chain-events/dist/src/moloch/types';

import EventStorageHandler from '../eventHandlers/storage';
import EventNotificationHandler from '../eventHandlers/notifications';
import MigrationHandler from '../eventHandlers/migration';
import EntityArchivalHandler from '../eventHandlers/entityArchival';

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

const setupChainEventListeners = async (models, wss: WebSocket.Server, skipCatchup?: boolean, migrate?: string) => {
  log.info('Fetching node urls...');
  const nodes = await models.ChainNode.findAll();
  log.info('Setting up event listeners...');
  await Promise.all(nodes
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

      // handlers are run in order, so if migrating, we run migration -> entityArchival,
      // but normally it's storage -> notification -> entityArchival
      if (migrate) {
        handlers.push(migrationHandler, entityArchivalHandler);
      } else {
        handlers.push(storageHandler, notificationHandler, entityArchivalHandler);
      }
      let subscriber: IEventSubscriber<any, any>;
      if (SubstrateEventChains.includes(node.chain)) {
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
        const provider = await createSubstrateProvider(nodeUrl);
        const api = await createSubstrateApi(provider, node.chain).isReady;
        subscriber = await subscribeSubstrateEvents({
          chain: node.chain,
          handlers,
          skipCatchup,
          discoverReconnectRange: () => discoverReconnectRange(models, node.chain),
          performMigration: !!migrate,
          api,
        });
      } else if (MolochEventChains.includes(node.chain)) {
        const contractVersion = 1;
        const api = await createMolochApi(node.url, contractVersion, node.address);
        subscriber = await subscribeMolochEvents({
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
      return subscriber;
    }));
};

export default setupChainEventListeners;
