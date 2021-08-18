import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { sequelize, DB } from '../database';

import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

const getTokenForum = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const address = req.query.address;
  if (!address) {
    return res.json({ status: 'Failure', message: 'Must provide token address' });
  }
  const token = await models.Token.findOne({ where: { address: { [Op.iLike]: address } } });
  if (token) {
    try {
      const result = await sequelize.transaction(async (t) => {
        const [ chain ] = await models.Chain.findOrCreate({
          where: { id: token.id },
          defaults: {
            active: true,
            network: token.id,
            type: 'token',
            icon_url: token.icon_url,
            symbol: token.symbol,
            name: token.name,
            base: 'ethereum',
            has_chain_events_listener: false
          },
          transaction: t,
        });
        const [ node ] = await models.ChainNode.findOrCreate({
          where: { chain: token.id },
          defaults: {
            chain: token.id,
            url: 'wss://mainnet.infura.io/ws',
            address: token.address,
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
