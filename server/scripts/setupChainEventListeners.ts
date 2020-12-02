import WebSocket from 'ws';
import _ from 'underscore';
import {
  IDisconnectedRange, IEventHandler, EventSupportingChains, IEventSubscriber,
  SubstrateTypes, SubstrateEvents, MolochTypes, MolochEvents, chainSupportedBy
} from '@commonwealth/chain-events';
import { Mainnet } from '@edgeware/node-types';

import EventStorageHandler from '../eventHandlers/storage';
import EventNotificationHandler from '../eventHandlers/notifications';
import EntityArchivalHandler from '../eventHandlers/entityArchival';
import IdentityHandler from '../eventHandlers/identity';
import UserFlagsHandler from '../eventHandlers/userFlags';
import { sequelize } from '../database';
import { constructSubstrateUrl } from '../../shared/substrate';
import { factory, formatFilename } from '../../shared/logging';
import { ChainNodeInstance } from '../models/chain_node';
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
  models, wss: WebSocket.Server, chains: string[] | 'all' | 'none', skipCatchup?: boolean
): Promise<{ [chain: string]: IEventSubscriber<any, any> }> => {
  log.info('Fetching node urls...');
  await sequelize.authenticate();
  const nodes: ChainNodeInstance[] = [];
  if (chains === 'all') {
    const n = (await Promise.all(EventSupportingChains.map((c) => {
      return models.ChainNode.findOne({ where: { chain: c } });
    }))).filter((c) => !!c);
    nodes.push(...n);
  } else if (chains !== 'none') {
    const n = (await Promise.all(EventSupportingChains
      .filter((c) => chains.includes(c))
      .map((c) => {
        return models.ChainNode.findOne({ where: { chain: c } });
      })))
      .filter((c) => !!c);
    nodes.push(...n);
  } else {
    log.info('No event listeners configured.');
    return {};
  }
  if (nodes.length === 0) {
    log.info('No event listeners found.');
    return {};
  }

  log.info('Setting up event listeners...');
  const subscribers = await Promise.all(nodes.map(async (node) => {
    const excludedEvents = [
      SubstrateTypes.EventKind.Reward,
      SubstrateTypes.EventKind.TreasuryRewardMinting,
      SubstrateTypes.EventKind.TreasuryRewardMintingV2,
    ];
    const storageHandler = new EventStorageHandler(models, node.chain, excludedEvents);
    const notificationHandler = new EventNotificationHandler(models, wss);
    const entityArchivalHandler = new EntityArchivalHandler(models, node.chain, wss);
    const identityHandler = new IdentityHandler(models, node.chain);
    const userFlagsHandler = new UserFlagsHandler(models, node.chain);
    const handlers: IEventHandler[] = [ storageHandler, notificationHandler, entityArchivalHandler ];
    let subscriber: IEventSubscriber<any, any>;
    if (chainSupportedBy(node.chain, SubstrateTypes.EventChains)) {
      // only handle identities and user flags on substrate chains
      handlers.push(identityHandler, userFlagsHandler);

      const nodeUrl = constructSubstrateUrl(node.url);
      const api = await SubstrateEvents.createApi(
        nodeUrl,
        node.chain.includes('edgeware') ? Mainnet : {},
      );
      subscriber = await SubstrateEvents.subscribeEvents({
        chain: node.chain,
        handlers,
        skipCatchup,
        discoverReconnectRange: () => discoverReconnectRange(models, node.chain),
        api,
      });
    } else if (chainSupportedBy(node.chain, MolochTypes.EventChains)) {
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
  return _.object<{ [chain: string]:  IEventSubscriber<any, any> }>(subscribers);
};

export default setupChainEventListeners;
