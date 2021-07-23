/**
 * This script "migrates" councillors and validators into the database.
 */

import _ from 'underscore';
import { SubstrateTypes, SubstrateEvents, chainSupportedBy } from '@commonwealth/chain-events';
import { AccountId, Balance } from '@polkadot/types/interfaces';
import { Vec } from '@polkadot/types';
import { Codec } from '@polkadot/types/types';

import UserFlagsHandler from '../eventHandlers/userFlags';
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

  // 2. for each node, fetch councillors and validators
  for (const node of nodes) {
    log.info(`Fetching and migrating councillor/validator flags for ${node.chain}.`);
    const flagsHandler = new UserFlagsHandler(models, node.chain);

    const nodeUrl = constructSubstrateUrl(node.url);
    try {
      const api = await SubstrateEvents.createApi(nodeUrl, node.Chain.substrate_spec);

      log.info('Fetching councillor and validator lists...');
      const validators = await api.derive.staking?.validators();
      const section = api.query.electionsPhragmen ? 'electionsPhragmen' : 'elections';
      const councillors = await api.query[section].members<Vec<[ AccountId, Balance ] & Codec>>();
      await flagsHandler.forceSync(
        councillors.map(([ who ]) => who.toString()),
        validators ? validators.validators.map((v) => v.toString()) : [],
      );
    } catch (e) {
      log.error(`Failed to migrate flags for ${node.chain}: ${e.message}`);
    }
  }
}
