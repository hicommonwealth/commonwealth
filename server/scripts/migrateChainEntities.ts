/**
 * This script "migrates" chain entities (proposals) from the chain into the database, by first
 * querying events, and then attempting to fetch corresponding entities
 * from the chain, writing the results back into the database.
 */

import _ from 'underscore';
import {
  SubstrateTypes,
  SubstrateEvents,
  chainSupportedBy,
  isSupportedChain,
  IStorageFetcher,
  MarlinTypes,
  MolochTypes,
  AaveTypes,
  AaveEvents,
  IDisconnectedRange,
  EventSupportingChains,
} from '@commonwealth/chain-events';

import MigrationHandler from '../eventHandlers/migration';
import EntityArchivalHandler from '../eventHandlers/entityArchival';
import { ChainNodeInstance } from '../models/chain_node';

import { factory, formatFilename } from '../../shared/logging';
import { constructSubstrateUrl } from '../../shared/substrate';

const log = factory.getLogger(formatFilename(__filename));

export async function migrateChainEntity(models, chain: string): Promise<void> {
  // 1. fetch the node and url of supported/selected chains
  log.info(`Fetching node info for ${chain}...`);
  if (!chain) {
    throw new Error('must provide chain');
  }
  if (!isSupportedChain(chain)) {
    throw new Error('unsupported chain');
  }

  // query one node for each supported chain
  const node: ChainNodeInstance = await models.ChainNode.findOne({ where: { chain } });
  if (!node) {
    throw new Error('no nodes found for chain entity migration');
  }

  // 2. for each node, fetch and migrate chain entities
  log.info(`Fetching and migrating chain entities for: ${chain}`);
  try {
    const migrationHandler = new MigrationHandler(models, chain);
    const entityArchivalHandler = new EntityArchivalHandler(models, chain);
    let fetcher: IStorageFetcher<any>;
    const range: IDisconnectedRange = { startBlock: 0 };
    if (chainSupportedBy(chain, SubstrateTypes.EventChains)) {
      const nodeUrl = constructSubstrateUrl(node.url);
      const api = await SubstrateEvents.createApi(nodeUrl, node.Chain.substrate_spec);
      fetcher = new SubstrateEvents.StorageFetcher(api);
    } else if (chainSupportedBy(chain, MolochTypes.EventChains)) {
      // TODO: determine moloch API version
      // TODO: construct dater
      throw new Error('Moloch migration not yet implemented.');
    } else if (chainSupportedBy(chain, MarlinTypes.EventChains)) {
      // TODO: construct dater
      throw new Error('Marlin migration not yet implemented.');
    } else if (chainSupportedBy(chain, AaveTypes.EventChains)) {
      const api = await AaveEvents.createApi(node.url, node.address);
      fetcher = new AaveEvents.StorageFetcher(api);
      // TODO: remove once testing completed
      range.startBlock = chain === 'aave' ? 12200000 : 0;
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

export async function migrateChainEntities(models): Promise<void> {
  // for (const chain of EventSupportingChains) {
  //   await migrateChainEntity(models, chain);
  // }
  await migrateChainEntity(models, 'dydx-ropsten');
}
