/**
 * This script "migrates" chain entities (proposals) from the chain into the database, by first
 * querying events, and then attempting to fetch corresponding entities
 * from the chain, writing the results back into the database.
 */

import _ from 'underscore';
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import { factory, formatFilename } from 'common-common/src/logging';
import {
  SubstrateEvents,
  IStorageFetcher,
  CompoundEvents,
  CosmosEvents,
  AaveEvents,
  IDisconnectedRange,
  CommonwealthEvents,
} from 'chain-events/src';
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import { factory, formatFilename } from 'common-common/src/logging';

import models from '../database';
import MigrationHandler from '../eventHandlers/migration';
import EntityArchivalHandler from '../eventHandlers/entityArchival';
import ProjectHandler from '../eventHandlers/project';
import { ChainInstance } from '../models/chain';
import { constructSubstrateUrl } from '../../shared/substrate';

const log = factory.getLogger(formatFilename(__filename));

const ENTITY_MIGRATION = process.env.ENTITY_MIGRATION;

export async function migrateChainEntity(chain: string): Promise<void> {
  // 1. fetch the node and url of supported/selected chains
  log.info(`Fetching node info for ${chain}...`);
  if (!chain) {
    throw new Error('must provide chain');
  }

  // query one node for each supported chain
  const chainInstance: ChainInstance = await models['Chain'].findOne({
    where: { id: chain },
  });
  if (!chainInstance) {
    throw new Error('no chain found for chain entity migration');
  }
  const node = await models['ChainNode'].scope('withPrivateData').findOne({
    where: { id: chainInstance.chain_node_id },
  });
  if (!node) {
    throw new Error('no nodes found for chain entity migration');
  }

  // 2. for each node, fetch and migrate chain entities
  log.info(`Fetching and migrating chain entities for: ${chain}`);
  try {
    const migrationHandler = new MigrationHandler(models, chain);
    const entityArchivalHandler = new EntityArchivalHandler(models, chain);
    const projectHandler = new ProjectHandler(models);
    let fetcher: IStorageFetcher<any>;
    const range: IDisconnectedRange = { startBlock: 0 };
    if (chainInstance.base === ChainBase.Substrate) {
      const nodeUrl = constructSubstrateUrl(node.private_url || node.url);
      const api = await SubstrateEvents.createApi(
        nodeUrl,
        chainInstance.substrate_spec
      );
      fetcher = new SubstrateEvents.StorageFetcher(api);
    } else if (chainInstance.base === ChainBase.CosmosSDK) {
      const api = await CosmosEvents.createApi(
        node.private_url || node.url
      );
      fetcher = new CosmosEvents.StorageFetcher(api);
    } else if (chainInstance.network === ChainNetwork.Moloch) {
      // TODO: determine moloch API version
      // TODO: construct dater
      throw new Error('Moloch migration not yet implemented.');
    } else if (chainInstance.network === ChainNetwork.Compound) {
      const contracts = await chainInstance.getContracts({
        include: [{ model: models.ChainNode, required: true }],
      });
      const api = await CompoundEvents.createApi(
        contracts[0].ChainNode.private_url || contracts[0].ChainNode.url,
        contracts[0].address
      );
      fetcher = new CompoundEvents.StorageFetcher(api);
      range.startBlock = 0;
    } else if (chainInstance.network === ChainNetwork.Aave) {
      const contracts = await chainInstance.getContracts({
        include: [{ model: models.ChainNode, required: true }],
      });
      const api = await AaveEvents.createApi(
        contracts[0].ChainNode.private_url || contracts[0].ChainNode.url,
        contracts[0].address
      );
      fetcher = new AaveEvents.StorageFetcher(api);
      range.startBlock = 0;
    } else if (chainInstance.network === ChainNetwork.CommonProtocol) {
      const contracts = await chainInstance.getContracts({
        include: [{ model: models.ChainNode, required: true }],
      });
      const api = await CommonwealthEvents.createApi(
        contracts[0].ChainNode.private_url || contracts[0].ChainNode.url,
        contracts[0].address
      );
      fetcher = new CommonwealthEvents.StorageFetcher(api);
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
        if (chainInstance.network === ChainNetwork.CommonProtocol) {
          await projectHandler.handle(event, dbEvent);
        }
      } catch (e) {
        log.error(`Event handle failure: ${e.message}`);
      }
    }
  } catch (e) {
    log.error(`Failed to fetch events for ${chain}: ${e.message}`);
  }
}

export async function migrateChainEntities(): Promise<void> {
  const chains = await models.Chain.findAll({
    where: {
      active: true,
      // has_chain_events_listener: true,
    },
  });
  for (const { id } of chains) {
    await migrateChainEntity(id);
  }
}

export async function runMigrations() {
  // "all" means run for all supported chains, otherwise we pass in the name of
  // the specific chain to migrate
  log.info('Started migrating chain entities into the DB');
  try {
    await (ENTITY_MIGRATION === 'all'
      ? migrateChainEntities()
      : migrateChainEntity(ENTITY_MIGRATION));
    log.info('Finished migrating chain entities into the DB');
    process.exit(0);
  } catch (e) {
    console.error('Failed migrating chain entities into the DB: ', e.message);
    process.exit(1);
  }
}
