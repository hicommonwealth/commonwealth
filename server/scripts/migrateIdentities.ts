/**
 * This script "migrates" identities from the chain into the database, by first
 * querying all addresses, and then attempting to fetch corresponding identities
 * from the chain, writing the results back into the database.
 */

import _ from 'underscore';
import { SubstrateTypes, SubstrateEvents } from '@commonwealth/chain-events';
import { OffchainProfileAttributes, OffchainProfileInstance } from '../models/offchain_profile';
import IdentityEventHandler from '../eventHandlers/identity';

import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export async function migrateIdentities(models, chain?: string): Promise<void> {
  // 1. fetch the node and url of supported/selected chains
  log.info('Fetching node info for identity migrations...');
  const nodes = [];
  if (!chain) {
    // query one node for each supported chain
    for (const supportedChain of SubstrateTypes.EventChains) {
      // eslint-disable-next-line no-await-in-loop
      nodes.push(await models.ChainNode.findOne({
        where: { chain: supportedChain }
      }));
    }
  } else {
    // query one node for provided chain
    nodes.push(await models.ChainNode.findOne({
      where: { chain }
    }));
  }
  if (!nodes) {
    throw new Error('no nodes found for identity migration');
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
    let nodeUrl = node.url;
    const hasProtocol = nodeUrl.indexOf('wss://') !== -1 || nodeUrl.indexOf('ws://') !== -1;
    nodeUrl = hasProtocol ? nodeUrl.split('://')[1] : nodeUrl;
    const isInsecureProtocol = nodeUrl.indexOf('kusama-rpc.polkadot.io') === -1
      && nodeUrl.indexOf('rpc.polkadot.io') === -1;
    const protocol = isInsecureProtocol ? 'ws://' : 'wss://';
    if (nodeUrl.indexOf(':9944') !== -1) {
      nodeUrl = isInsecureProtocol ? nodeUrl : nodeUrl.split(':9944')[0];
    }
    nodeUrl = protocol + nodeUrl;
    const provider = await SubstrateEvents.createProvider(nodeUrl);
    const api = await SubstrateEvents.createApi(provider, node.chain).isReady;
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
    log.info(`Writing identities for chain ${node.chain} back to db...`);
    const handler = new IdentityEventHandler(models, node.chain);
    await Promise.all(identityEvents.map((e) => handler.handle(e, null)));
  }
}
