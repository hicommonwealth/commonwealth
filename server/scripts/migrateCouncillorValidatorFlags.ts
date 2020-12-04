/**
 * This script "migrates" chain entities (proposals) from the chain into the database, by first
 * querying events, and then attempting to fetch corresponding entities
 * from the chain, writing the results back into the database.
 */

import _ from 'underscore';
import { SubstrateTypes, SubstrateEvents, chainSupportedBy } from '@commonwealth/chain-events';
import { Mainnet } from '@edgeware/node-types';
import { AccountId, Balance } from '@polkadot/types/interfaces';
import { Vec } from '@polkadot/types';
import { Codec } from '@polkadot/types/types';

import UserFlagsHandler from '../eventHandlers/userFlags';

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
  const nodes = (await Promise.all(chains.map((c) => {
    return models.ChainNode.findOne({ where: { chain: c } });
  }))).filter((n) => !!n);
  if (!nodes) {
    throw new Error('no nodes found for chain entity migration');
  }

  // 2. for each node, fetch and migrate chain entities
  for (const node of nodes) {
    log.info(`Fetching and migrating councillor/validator flags for ${node.chain}.`);
    const flagsHandler = new UserFlagsHandler(models, node.chain);

    const nodeUrl = constructSubstrateUrl(node.url);
    const api = await SubstrateEvents.createApi(
      nodeUrl,
      node.chain.includes('edgeware') ? Mainnet : {},
    );

    log.info('Fetching councillor and validator lists...');
    try {
      const validators = await api.derive.staking?.validators();
      const section = api.query.electionsPhragmen ? 'electionsPhragmen' : 'elections';
      const councillors = await api.query[section].members<Vec<[ AccountId, Balance ] & Codec>>();
      await flagsHandler.forceSync(
        councillors.map(([ who ]) => who.toString()),
        validators ? validators.validators.map((v) => v.toString()) : [],
      );
    } catch (e) {
      log.error(`Failed to sync flags: ${e.message}.`);
    }
  }
}
