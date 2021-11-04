import Sequelize, { Op } from 'sequelize';
import { DB } from '../database';
import { ChainAttributes } from '../models/chain';

// we support all eth chains which have an active node in the database
// TODO: use this route to display a dropdown/list of supported tokens, rather than forcing
//   an entry where we test for validity
// TODO: fetch a native token, name, symbol, etc. as well, maybe using tokenlist?
export async function getSupportedEthChainIds(models: DB): Promise<{ [id: number]: string }> {
  const supportedChainIds = await models.ChainNode.findAll({
    attributes: ['url', 'eth_chain_id', ],
    group: ['url', 'eth_chain_id'],
    where: {
      // get all nodes that have a valid chain id
      eth_chain_id: {
        [Op.and]: {
          [Op.ne]: null,
          [Op.ne]: 0,
        }
      }
    }
  });
  // TODO: should we verify that chain associations are active?

  const results: { [id: number]: string } = {};
  for (const { eth_chain_id, url } of supportedChainIds) {
    results[eth_chain_id] = url;
  }
  return results;
}

export async function getUrlForEthChainId(models: DB, chainId: number): Promise<string | null> {
  const chainIds = await getSupportedEthChainIds(models);
  return chainIds[chainId] || null;
}
