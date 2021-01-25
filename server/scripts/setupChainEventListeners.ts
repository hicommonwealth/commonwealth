import WebSocket from 'ws';
import _ from 'underscore';
import {
  IDisconnectedRange, IEventHandler, EventSupportingChains, IEventSubscriber,
  SubstrateTypes, MolochTypes, SubstrateEvents, MolochEvents, chainSupportedBy
} from '@commonwealth/chain-events';

// import { createApi, subscribeEvents } from '/home/myym/Desktop/Github/chain-events/src/substrate/subscribeFunc';

import { spec as EdgewareSpec } from '@edgeware/node-types';

import EventStorageHandler from '../eventHandlers/storage';
import EventNotificationHandler from '../eventHandlers/notifications';
import EntityArchivalHandler from '../eventHandlers/entityArchival';
import IdentityHandler from '../eventHandlers/identity';
import NewSessionHandler from '../eventHandlers/newSessionEvents';
import RewardHandler from '../eventHandlers/rewardEvents';
import SlashHandler from '../eventHandlers/slashEvents';
import BondHandler from '../eventHandlers/bondEvents';
import ImOnlineHandler from '../eventHandlers/imOnlineEvents';
import OffenceHandler from '../eventHandlers/offenceEvents';
import HeartbeatHandler from '../eventHandlers/heartbeatEvents';
import { sequelize } from '../database';
import { constructSubstrateUrl } from '../../shared/substrate';
import { factory, formatFilename } from '../../shared/logging';
import { ChainNodeInstance } from '../models/chain_node';
import { updateChainEventStatus, deleteOldHistoricalValidatorsStats }  from '../util/archivalNodeHelpers';

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
  models, wss: WebSocket.Server, chains: string | string[] | 'all' | 'none', skipCatchup?: boolean, archival?: boolean, startBlock?: number
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
    const n = (await Promise.all(EventSupportingChains.filter((c) => chains.includes(c)).map((c) => {
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

  // Read the archival node url and archival chain name from env
  const ARCHIVAL_NODE_URL = process.env.ARCHIVAL_NODE_URL;
  const ARCHIVAL_CHAIN = process.env.ARCHIVAL_CHAIN;


  log.info('Setting up event listeners...');
  const subscribers = await Promise.all(nodes.map(async (node) => {
    const excludedEvents = [
      SubstrateTypes.EventKind.TreasuryRewardMinting,
      SubstrateTypes.EventKind.TreasuryRewardMintingV2,
    ];
    const storageHandler = new EventStorageHandler(models, node.chain, excludedEvents);
    const notificationHandler = new EventNotificationHandler(models, wss);
    const entityArchivalHandler = new EntityArchivalHandler(models, node.chain, wss);
    const newSessionHandler = new NewSessionHandler(models, node.chain);
    const rewardHandler = new RewardHandler(models, node.chain);
    const slashHandler = new SlashHandler(models, node.chain);
    const bondHandler = new BondHandler(models, node.chain);
    const imOnlineHandler = new ImOnlineHandler(models, node.chain);
    const offenceHandler = new OffenceHandler(models, node.chain);
    const heartbeatHandler = new HeartbeatHandler(models, node.chain);
    const identityHandler = new IdentityHandler(models, node.chain);
    const handlers: IEventHandler[] = [
      storageHandler,
      notificationHandler,
      entityArchivalHandler,
    ];

    // handlers needed for staking ui. Need to execute these event handlers for
    // edgeware chain for blocks starting from 3139200 till head to popular
    // HistoricalValidatorStats using archival mode
    const handlersEdgeware: IEventHandler[] = [
      storageHandler,
      newSessionHandler,
      heartbeatHandler,
      rewardHandler,
      slashHandler,
      offenceHandler,
      bondHandler,
      imOnlineHandler
    ];

    let subscriber: IEventSubscriber<any, any>;
    if (chainSupportedBy(node.chain, SubstrateTypes.EventChains)) {
      // if running in archival mode then check if the chain is the same as provided in ARCHIVAL_CHAIN
      // parameter in env. If yes, then execute the archival mode using the ARCHIVAL_NODE_URL
      // and syncup with the head of the chain and then use the URL for the chain provided in db
      // and use it to subscribe to head of the chain to continue normal execution.
      if (archival && node.chain === ARCHIVAL_CHAIN && node.chain.includes('edgeware')) {
        // events processed by the staking-ui event handlers
        const eventList = [
          SubstrateTypes.EventKind.AllGood,
          SubstrateTypes.EventKind.Bonded,
          SubstrateTypes.EventKind.NewSession,
          SubstrateTypes.EventKind.Offence,
          SubstrateTypes.EventKind.Reward,
          SubstrateTypes.EventKind.Slash,
          SubstrateTypes.EventKind.SomeOffline,
          SubstrateTypes.EventKind.Unbonded
        ];
        // mark the events in ChainEvents as Inactive as when running archival we will be creating new entries
        // for the same events in db and marking them as Active
        // to do: once the archvial node has finished execution remove the old events marked as Inactive
        const chainEventRecordsUpdated = await updateChainEventStatus(models,
          startBlock, node.chain, eventList, 'inactive');

        // when running archival mode remove the already existing entried
        // in historicalValidatorStats as we will be re-creating the stats
        const historicalValidatorsStatsDeleted = await deleteOldHistoricalValidatorsStats(models,
          startBlock, node.chain);

        if (chainEventRecordsUpdated) console.info('Records marked as inactive in Chainevents table');
        if (historicalValidatorsStatsDeleted) console.info('Records removed from HistoricalValidatorsStats table');
        // run subscribeEvents with archival flag true, this will enforce it to
        // poll past blocks and process events starting from provided blockNumber
        const nodeUrl = constructSubstrateUrl(ARCHIVAL_NODE_URL);
        const api = await SubstrateEvents.createApi(
          nodeUrl,
          node.chain.includes('edgeware') ? EdgewareSpec : {},
        );

        await SubstrateEvents.subscribeEvents({
          chain: node.chain,
          handlers:handlersEdgeware,
          skipCatchup,
          archival:true,
          startBlock,
          discoverReconnectRange: () => discoverReconnectRange(models, ARCHIVAL_CHAIN),
          api,
        });
        log.info(`Finished archival syncing for chain ${ARCHIVAL_CHAIN}...`);
      }

      // only handle identities on substrate chains
      handlers.push(identityHandler);

      // only handle new-session, allgood, heartbeat, reward, slash, bond/unbond
      // on edgeware chain
      if (node.chain.includes('edgeware')) {
        handlers.push(...handlersEdgeware);
      }

      const nodeUrl = constructSubstrateUrl(node.url);
      const api = await SubstrateEvents.createApi(
        nodeUrl,
        node.chain.includes('edgeware') ? EdgewareSpec : {},
      );

      subscriber =  await SubstrateEvents.subscribeEvents({
        chain: node.chain,
        handlers,
        skipCatchup,
        archival:false,
        startBlock,
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
