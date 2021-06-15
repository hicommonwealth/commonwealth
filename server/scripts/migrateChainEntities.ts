/**
 * This script "migrates" chain entities (proposals) from the chain into the database, by first
 * querying events, and then attempting to fetch corresponding entities
 * from the chain, writing the results back into the database.
 */

import _ from 'underscore';
import { SubstrateTypes, SubstrateEvents, chainSupportedBy } from '@commonwealth/chain-events';

import MigrationHandler from '../eventHandlers/migration';
import EntityArchivalHandler from '../eventHandlers/entityArchival';
import { ChainNodeInstance } from '../models/chain_node';

import { factory, formatFilename } from '../../shared/logging';
import { constructSubstrateUrl } from '../../shared/substrate';
const log = factory.getLogger(formatFilename(__filename));

export default async function (models, chain?: string): Promise<void> {
  // 1. fetch the node and url of supported/selected chains
  log.info('Fetching node info for chain entity migrations...');
  if (chain && !chainSupportedBy(chain, SubstrateTypes.EventChains)) {
    throw new Error('unsupported chain');
  }
  const chains = !chain ? SubstrateTypes.EventChains.concat() : [ chain ];

  // query one node for each supported chain
  const nodes: ChainNodeInstance[] = (await Promise.all(chains.map((c) => {
    return models.ChainNode.findOne({
      where: { chain: c },
      include: [{
        model: models.Chain,
        where: { active: true },
        required: true,
      }] });
  }))).filter((n) => !!n);
  if (!nodes) {
    throw new Error('no nodes found for chain entity migration');
  }

  // 2. for each node, fetch and migrate chain entities
  for (const node of nodes) {
    console.log('Fetching and migrating chain entities for', node.chain);
    const migrationHandler = new MigrationHandler(models, node.chain);
    const entityArchivalHandler = new EntityArchivalHandler(models, node.chain);

    const nodeUrl = constructSubstrateUrl(node.url);
    try {
      const api = await SubstrateEvents.createApi(nodeUrl, node.Chain.substrate_spec);

      // fetch all events and run through handlers in sequence then exit
      log.info('Fetching chain events...');
      const fetcher = new SubstrateEvents.StorageFetcher(api);
      const events = await fetcher.fetch();

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
      log.error(`Failed to fetch events for ${node.chain}: ${e.message}`);
    }
  }
}
