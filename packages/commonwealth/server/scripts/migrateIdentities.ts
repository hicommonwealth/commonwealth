/**
 * This script "migrates" identities from the chain into the database,
 * by first querying all offchain addresses we have records for, and
 * then attempting to fetch corresponding identities from the chain,
 * and writing the results back into the database.
 */

import _ from 'underscore';
import { SubstrateEvents } from 'chain-events/src';
import { OffchainProfileInstance } from '../models/offchain_profile';
import IdentityEventHandler from '../eventHandlers/identity';
import { ChainBase } from 'common-common/src/types';
import { constructSubstrateUrl } from '../../shared/substrate';
import { factory, formatFilename } from 'common-common/src/logging';
const log = factory.getLogger(formatFilename(__filename));

export default async function (models, chain?: string): Promise<void> {
  // 1. fetch the node and url of supported/selected chains
  log.info('Fetching node info for identity migrations...');
  const whereOption = chain ? { chain } : {};
  const nodes = await models.ChainNode.findAll({
    where: whereOption,
    include: [
      {
        model: models.Chain,
        where: {
          active: true,
          has_chain_events_listener: true,
          base: ChainBase.Substrate,
        },
        required: true,
      },
    ],
  });
  if (!nodes) {
    throw new Error('no nodes found for chain entity migration');
  }

  // 2. for each node, fetch and migrate identities
  for (const node of nodes) {
    // 2a. query all available addresses in the db on the chain
    log.info(`Querying all profiles on chain ${node.chain}...`);
    const profiles: OffchainProfileInstance[] = await models.OffchainProfile.findAll({
      include: [{
        model: models.Address,
        where: {
          chain: node.chain,
        },
        required: true,
      }]
    });
    const addresses = profiles.map((p) => p.Address.address);

    // 2b. connect to chain and query all identities of found addresses
    log.info(`Fetching identities on chain ${node.chain} at url ${node.url}...`);
    const nodeUrl = constructSubstrateUrl(node.url);
    try {
      const api = await SubstrateEvents.createApi(nodeUrl, node.Chain.substrate_spec);
      const fetcher = new SubstrateEvents.StorageFetcher(api);
      const identityEvents = await fetcher.fetchIdentities(addresses);

      // 2c. remove all existing identities from profiles
      await Promise.all(profiles.map(async (p) => {
        if (p.identity || p.judgements) {
          p.identity = null;
          p.judgements = null;
          await p.save();
        }
      }));

      // 2d. write the found identities back to db using the event handler
      log.info(`Writing identities for chain ${node.chain} back to db... (count: ${identityEvents.length})`);
      const handler = new IdentityEventHandler(models, node.chain);
      await Promise.all(identityEvents.map((e) => handler.handle(e, null)));
    } catch (e) {
      log.error(`Failed to fetch identities from ${node.chain}: ${e.message}`);
    }
  }
}
