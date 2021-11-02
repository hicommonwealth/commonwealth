import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import Web3 from 'web3';
import { sequelize, DB } from '../database';
import { ChainBase, ChainNetwork, ChainType } from '../../shared/types';
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
  const web3 = new Web3(new Web3.providers.HttpProvider(`https://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr`));
  const code = await web3.eth.getCode(address);
  if (code === '0x') {
    // Account returns 0x, Smart contract returns bytecode
    return res.json({ status: 'Failure', message: 'Must provide contract address' });
  }
  const token = await models.Token.findOne({ where: { address: { [Op.iLike]: address } } });
  if (token) {
    try {
      const result = await sequelize.transaction(async (t) => {
        const [ chain ] = await models.Chain.findOrCreate({
          where: { id: token.id },
          defaults: {
            active: true,
            network: ChainNetwork.ERC20,
            type: ChainType.Token,
            icon_url: token.icon_url,
            symbol: token.symbol,
            name: token.name,
            decimals: token.decimals,
            base: ChainBase.Ethereum,
            has_chain_events_listener: false,
          },
          transaction: t,
        });
        const [ node ] = await models.ChainNode.findOrCreate({
          where: { chain: token.id },
          defaults: {
            chain: token.id,
            url: 'wss://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr',
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
    if (req.query.allowUncached) {
      return res.json({ status: 'Success', result: { chain: null, node: null } });
    }
    return res.json({ status: 'Failure', message: 'Token does not exist' });
  }
};

export default getTokenForum;
