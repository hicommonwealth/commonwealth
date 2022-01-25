import { Request, Response, NextFunction } from 'express';
import Sequelize, { Op } from 'sequelize';
import Web3 from 'web3';
import { sequelize, DB } from '../database';
import { ChainBase, ChainNetwork, ChainType } from '../../shared/types';
import { getUrlsForEthChainId } from '../util/supportedEthChains';
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

  // default to mainnet
  const chain_id = +req.query.chain_id || 1;
  const token = await models.Token.findOne({
    where: {
      address: { [Op.iLike]: address },
      chain_id,
    }
  });
  const urls = await getUrlsForEthChainId(models, chain_id);
  let url;
  if (urls) {
    url = urls.url;
  } else {
    url = req.query.url;
    if (!url) {
      return res.json({ status: 'Failure', message: 'Unsupported chain' });
    }
  }

  if (!token && !req.query.allowUncached) {
    return res.json({ status: 'Failure', message: 'Token does not exist' });
  }

  try {
    const provider = new Web3.providers.WebsocketProvider(url);
    const web3 = new Web3(provider);
    const code = await web3.eth.getCode(address);
    provider.disconnect(1000, 'finished');
    if (code === '0x') {
      // Account returns 0x, Smart contract returns bytecode
      return res.json({ status: 'Failure', message: 'Must provide valid contract address' });
    }
    if (req.query.autocreate) {
      const result = await sequelize.transaction(async (t) => {
        const [chain] = await models.Chain.findOrCreate({
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
        const [node] = await models.ChainNode.findOrCreate({
          where: { chain: token.id },
          defaults: {
            chain: token.id,
            url,
            address: token.address,
            eth_chain_id: chain_id,
          },
          transaction: t,
        });
        return { chain: chain.toJSON(), node: node.toJSON() };
      });
      return res.json({ status: 'Success', result });
    } else {
      // only return token data if we do not autocreate
      return res.json({ status: 'Success', token: token ? token.toJSON() : {} });
    }
  } catch (e) {
    log.error(e.message);
    return res.json({ status: 'Failure', message: 'Failed to find or create chain' });
  }
};

export default getTokenForum;
