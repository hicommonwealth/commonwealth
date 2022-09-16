import { Request, Response } from 'express';
import { factory, formatFilename } from 'common-common/src/logging';

import TokenBalanceCache from "../cache";
import { validateSecret } from './util';

const log = factory.getLogger(formatFilename(__filename));

const getBalance = async (
  cache: TokenBalanceCache,
  req: Request,
  res: Response
) => {
  if (!validateSecret(req.body.secret)) {
    return res.status(401).json('Not authorized');
  }
  const { chain_node_id, addresses, provider, opts } = req.body;
  if (!chain_node_id || !+chain_node_id || !addresses) {
    return res.status(400).json('Request must contain chain_node_id and addresses');
  }
  const addressArray = addresses.split(',');
  const results = {};
  for (const address of addressArray) {
    try {
      const balance = await cache.getBalance(chain_node_id, address, provider, opts);
      results[address] = balance.toString();
    } catch (e) {
      // TODO: error handling -- should we fail if ANY fail? or return an error?
      log.info(`Failed to query balance for ${address}: ${e.message}`);
    }
  }
  return res.status(200).json(results);
};

export default getBalance;