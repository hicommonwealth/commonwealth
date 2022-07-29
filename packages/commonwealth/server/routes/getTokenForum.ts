import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Web3 from 'web3';
import { DB } from '../database';
import { ChainBase, ChainNetwork, ChainType } from 'common-common/src/types';
import { factory, formatFilename } from 'common-common/src/logging';
const log = factory.getLogger(formatFilename(__filename));

const getTokenForum = async (
  models: DB,
  req: Request,
  res: Response,
) => {
  const address = req.query.address;
  if (!address) {
    return res.json({ status: 'Failure', message: 'Must provide token address' });
  }

  // default to mainnet
  const chain_id = +req.query.chain_id || 1;
  // default to ERC20
  const chain_network = req.query.chain_network? req.query.chain_network : ChainNetwork.ERC20;
  const token = await models.Token.findOne({
    where: {
      address: { [Op.iLike]: address },
      chain_id,
    }
  });
  const node = await models.ChainNode.scope('withPrivateData').findOne({ where: { eth_chain_id: chain_id }});
  let url = node.url;
  if (!url) {
    url = req.query.url;
    if (!url) {
      return res.json({ status: 'Failure', message: 'Unsupported chain' });
    }
  }

  if (!token && !req.query.allowUncached) {
    return res.json({ status: 'Failure', message: 'Token does not exist' });
  }

  try {
    const provider = new Web3.providers.WebsocketProvider(node?.private_url || url);
    const web3 = new Web3(provider);
    const code = await web3.eth.getCode(address);
    provider.disconnect(1000, 'finished');
    if (code === '0x') {
      // Account returns 0x, Smart contract returns bytecode
      return res.json({ status: 'Failure', message: 'Must provide valid contract address' });
    }
    if (req.query.autocreate) {
      if (!node) {
        return res.json({ status: 'Failure', message: 'Cannot autocreate custom node' });
      }
      const [chain] = await models.Chain.findOrCreate({
        where: { id: token.id },
        defaults: {
          active: true,
          network: chain_network,
          type: ChainType.Token,
          icon_url: token.icon_url,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          base: ChainBase.Ethereum,
          has_chain_events_listener: false,
        },
      });
      const nodeJSON = node.toJSON();
      delete nodeJSON.private_url;
      return res.json({ status: 'Success', result: { chain: chain.toJSON(), node: nodeJSON }});
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
