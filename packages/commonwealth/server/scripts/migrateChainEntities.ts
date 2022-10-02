/**
 * This script "migrates" chain entities (proposals) from the chain into the database, by first
 * querying events, and then attempting to fetch corresponding entities
 * from the chain, writing the results back into the database.
 */

import {
  SubstrateEvents,
  IStorageFetcher,
  CompoundEvents,
  AaveEvents,
  IDisconnectedRange,
} from 'chain-events/src';

import cwModels from '../database';
import ceModels from 'chain-events/services/database/database'
import MigrationHandler from 'chain-events/services/ChainEventsConsumer/ChainEventHandlers/migration';
import EntityArchivalHandler from 'chain-events/services/ChainEventsConsumer/ChainEventHandlers/entityArchival';
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import { factory, formatFilename } from 'common-common/src/logging';
import { constructSubstrateUrl } from '../../shared/substrate';
import {BrokerConfig} from "rascal";
import {RABBITMQ_URI} from "../config";
import {RabbitMQController, getRabbitMQConfig} from 'common-common/src/rabbitmq'

const log = factory.getLogger(formatFilename(__filename));

const CHAIN_ID = process.env.CHAIN_ID;

async function migrateChainEntity(chain: string, rmqController: RabbitMQController): Promise<void> {
  // 1. fetch the node and url of supported/selected chains
  log.info(`Fetching node info for ${chain}...`);
  if (!chain) {
    throw new Error('must provide chain');
  }

  // query one node for each supported chain
  const chainInstance = await cwModels.Chain.findOne({
    where: { id: chain },
  });
  if (!chainInstance) {
    throw new Error('no chain found for chain entity migration');
  }
  const node = await cwModels.ChainNode.findOne({
    where: { id: chainInstance.chain_node_id },
  });
  if (!node) {
    throw new Error('no nodes found for chain entity migration');
  }

  // 2. for each node, fetch and migrate chain entities
  log.info(`Fetching and migrating chain entities for: ${chain}`);
  try {
    const migrationHandler = new MigrationHandler(ceModels, rmqController, chain);
    const entityArchivalHandler = new EntityArchivalHandler(ceModels, rmqController, chain);
    let fetcher: IStorageFetcher<any>;
    const range: IDisconnectedRange = { startBlock: 0 };
    if (chainInstance.base === ChainBase.Substrate) {
      const nodeUrl = constructSubstrateUrl(node.url);
      console.log(chainInstance.substrate_spec)
      const api = await SubstrateEvents.createApi(
        nodeUrl,
        chainInstance.substrate_spec
      );
      fetcher = new SubstrateEvents.StorageFetcher(api);
    } else if (chainInstance.network === ChainNetwork.Moloch) {
      // TODO: determine moloch API version
      // TODO: construct dater
      throw new Error('Moloch migration not yet implemented.');
    } else if (chainInstance.network === ChainNetwork.Compound) {
      const contracts = await chainInstance.getContracts({
        include: [{ model: cwModels.ChainNode, required: true }],
      });
      const api = await CompoundEvents.createApi(
        contracts[0].ChainNode.private_url || contracts[0].ChainNode.url,
        contracts[0].address
      );
      fetcher = new CompoundEvents.StorageFetcher(api);
      range.startBlock = 0;
    } else if (chainInstance.network === ChainNetwork.Aave) {
      const contracts = await chainInstance.getContracts({
        include: [{ model: cwModels.ChainNode, required: true }],
      });
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
        await entityArchivalHandler.handle(event, dbEvent);
      } catch (e) {
        log.error(`Event handle failure: ${e.message}`);
      }
    }
  } catch (e) {
    log.error(`Failed to fetch events for ${chain}: ${e.message}`);
  }
}

async function migrateChainEntities(rmqController: RabbitMQController): Promise<void> {
  const chains = await cwModels.Chain.findAll({
    where: {
      active: true
    },
  });
  for (const { id } of chains) {
    await migrateChainEntity(id, rmqController);
  }
}

export async function runEntityMigrations(chainId?: string) {
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
    if (CHAIN_ID || chainId) await migrateChainEntity(CHAIN_ID || chainId, rmqController)
    else await migrateChainEntities(rmqController)
    log.info('Finished migrating chain entities into the DB');
    process.exit(0);
  } catch (e) {
    console.error('Failed migrating chain entities into the DB: ', e.message);
    process.exit(1);
  }
}
