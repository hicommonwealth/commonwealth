/**
 * This script "migrates" chain entities (proposals) from the chain into the database, by first
 * querying events, and then attempting to fetch corresponding entities
 * from the chain, writing the results back into the database.
 */

import type { IDisconnectedRange, IStorageFetcher } from 'chain-events/src';
import {
  AaveEvents,
  CompoundEvents,
  CosmosEvents,
  SubstrateEvents,
} from 'chain-events/src';
import { factory, formatFilename } from 'common-common/src/logging';
import { ChainBase, ChainNetwork } from 'common-common/src/types';

import EntityArchivalHandler from 'chain-events/services/ChainEventsConsumer/ChainEventHandlers/entityArchival';
import MigrationHandler from 'chain-events/services/ChainEventsConsumer/ChainEventHandlers/migration';
import ceModels from 'chain-events/services/database/database';
import { AbstractRabbitMQController } from 'common-common/src/rabbitmq/types';
import {
  getRabbitMQConfig,
  RabbitMQController,
} from 'common-common/src/rabbitmq';
import fetch from 'node-fetch';
import type { BrokerConfig } from 'rascal';
import { RABBITMQ_URI } from '../../commonwealth/server/config';
import { constructSubstrateUrl } from '../../commonwealth/shared/substrate';
import { CHAIN_EVENT_SERVICE_SECRET, CW_SERVER_URL } from '../services/config';
import NotificationsHandler from '../services/ChainEventsConsumer/ChainEventHandlers/notification';
import models from '../services/database/database';
import { EventKind } from '../src/chains/substrate/types';

const log = factory.getLogger(formatFilename(__filename));

const CHAIN_ID = process.env.CHAIN_ID;

class HTTPResponseError extends Error {
  public response: any;
  constructor(response) {
    super(`HTTP Error Response: ${response.status} ${response.statusText}`);
    this.response = response;
  }
}

async function fetchData(url: string, data: any) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ secret: CHAIN_EVENT_SERVICE_SECRET, ...data }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) return (await res.json()).result;
    throw new HTTPResponseError(res);
  } catch (e) {
    log.error(`Fetch to ${url} with data ${JSON.stringify(data)} failed.`);
    console.error(e);
    throw e;
  }
}

async function migrateChainEntity(
  chain: string,
  rmqController: AbstractRabbitMQController
): Promise<void> {
  // 1. fetch the node and url of supported/selected chains
  log.info(`Fetching node info for ${chain}...`);
  if (!chain) {
    throw new Error('must provide chain');
  }

  // query one node for each supported chain
  const chainInstance = await fetchData(`${CW_SERVER_URL}/api/getChain`, {
    chain_id: chain,
  });
  if (!chainInstance) {
    throw new Error('no chain found for chain entity migration');
  }

  const node = await fetchData(`${CW_SERVER_URL}/api/getChainNode`, {
    chain_node_id: chainInstance.chain_node_id,
  });
  if (!node) {
    throw new Error('no nodes found for chain entity migration');
  }

  // 2. for each node, fetch and migrate chain entities
  log.info(`Fetching and migrating chain entities for: ${chain}`);
  try {
    const migrationHandler = new MigrationHandler(
      ceModels,
      rmqController,
      chain
    );
    const entityArchivalHandler = new EntityArchivalHandler(
      ceModels,
      rmqController,
      chain
    );

    const excludedNotificationEvents = [EventKind.DemocracyTabled];
    const notificationsHandler = new NotificationsHandler(
      models,
      rmqController,
      excludedNotificationEvents
    );

    let fetcher: IStorageFetcher<any>;
    const range: IDisconnectedRange = { startBlock: 0 };
    if (chainInstance.base === ChainBase.CosmosSDK) {
      const api = await CosmosEvents.createApi(node.private_url || node.url);
      fetcher = new CosmosEvents.StorageFetcher(api);
    } else if (chainInstance.network === ChainNetwork.Compound) {
      const contracts = await fetchData(
        `${CW_SERVER_URL}/api/getChainContracts`,
        { chain_id: chain }
      );
      const api = await CompoundEvents.createApi(
        contracts[0].ChainNode.private_url || contracts[0].ChainNode.url,
        contracts[0].address
      );
      fetcher = new CompoundEvents.StorageFetcher(api);
      range.startBlock = 0;
    } else if (chainInstance.network === ChainNetwork.Aave) {
      const contracts = await fetchData(
        `${CW_SERVER_URL}/api/getChainContracts`,
        { chain_id: chain }
      );
      const api = await AaveEvents.createApi(
        contracts[0].ChainNode.private_url || contracts[0].ChainNode.url,
        contracts[0].address
      );
      fetcher = new AaveEvents.StorageFetcher(api);
      range.startBlock = 0;
    } else {
      throw new Error('Unsupported migration chain');
    }

    log.info('Fetching chain events...');
    const events = await fetcher.fetch(range, true);
    events.sort((a, b) => a.blockNumber - b.blockNumber);
    log.info(`Writing chain events to db... (count: ${events.length})`);
    for (const event of events) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const dbEvent = await migrationHandler.handle(event);
        const ceEvent = await entityArchivalHandler.handle(event, dbEvent);
        await notificationsHandler.handle(event, ceEvent);
      } catch (e) {
        log.error(`Event handle failure: ${e.message}`);
      }
    }
  } catch (e) {
    log.error(`Failed to fetch events for ${chain}: ${e.message}`);
  }
}

async function migrateChainEntities(
  rmqController: AbstractRabbitMQController
): Promise<void> {
  const chains = await fetchData(
    `${CW_SERVER_URL}/api/getSubscribedChains`,
    {}
  );
  for (const { id } of chains) {
    await migrateChainEntity(id, rmqController);
  }
}

export async function runEntityMigrations(chainId?: string): Promise<void> {
  // "all" means run for all supported chains, otherwise we pass in the name of
  // the specific chain to migrate
  log.info('Started migrating chain entities into the DB');

  let rmqController: RabbitMQController;
  try {
    rmqController = new RabbitMQController(
      <BrokerConfig>getRabbitMQConfig(RABBITMQ_URI)
    );
    await rmqController.init();
  } catch (e) {
    log.error(
      'Rascal consumer setup failed. Please check the Rascal configuration'
    );
    // if rabbitmq fails the script should not continue
    process.exit(1);
  }

  try {
    if (CHAIN_ID || chainId)
      await migrateChainEntity(CHAIN_ID || chainId, rmqController);
    else await migrateChainEntities(rmqController);
    log.info('Finished migrating chain entities into the DB');
    process.exit(0);
  } catch (e) {
    console.error('Failed migrating chain entities into the DB: ', e.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runEntityMigrations(process.argv[2]);
}
