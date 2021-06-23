
import { Request, Response, NextFunction } from 'express';
import { sequelize } from '../database';
import TokenBalanceCache from '../util/tokenBalanceCache';

import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

const getTokenForum = async (
  models,
  tokenBalanceCache: TokenBalanceCache,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const address = req.query.address;
  if (!address) {
    return res.json({ status: 'Failure', message: 'Must provide token address' });
  }
  const token = tokenBalanceCache.getToken(address);
  if (token) {
    try {
      const result = await sequelize.transaction(async (t) => {
        const [ chain ] = await models.Chain.findOrCreate({
          where: { id: token.id },
          defaults: {
            active: true,
            network: token.id,
            type: 'token',
            icon_url: token.iconUrl,
            symbol: token.symbol,
            name: token.name,
            decimals: token.decimals,
            default_chain: 'ethereum',
            base: 'ethereum',
          },
          transaction: t,
        });
        const [ node ] = await models.ChainNode.findOrCreate({
          where: { chain: token.id },
          defaults: {
            url: 'wss://mainnet.infura.io/ws',
            address: token.address
          },
          transaction: t,
        });
        return { chain: chain.toJSON(), node: node.toJSON() };
      });
      return res.json({ status: 'Success', result });
    } catch (e) {
      log.error(e.message);
      return res.json({ status: 'Failure', message: 'Failed to find or create chain' });
    }
  } else {
    return res.json({ status: 'Failure', message: 'Token does not exist' });
  }
};

export default getTokenForum;
