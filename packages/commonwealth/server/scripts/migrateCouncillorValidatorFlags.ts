/**
 * This script "migrates" councillors and validators into the database.
 */

import _ from 'underscore';
import { SubstrateEvents } from 'chain-events/src';
import { AccountId, Balance } from '@polkadot/types/interfaces';
import { Vec } from '@polkadot/types';
import { Codec } from '@polkadot/types/types';

import UserFlagsHandler from '../eventHandlers/userFlags';
import { ChainBase } from 'common-common/src/types';
import { factory, formatFilename } from 'common-common/src/logging';
import { constructSubstrateUrl } from '../../shared/substrate';
const log = factory.getLogger(formatFilename(__filename));

export default async function (models, chain?: string): Promise<void> {
  // 1. fetch the node and url of supported/selected chains
  log.info('Fetching node info for chain entity migrations...');
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
