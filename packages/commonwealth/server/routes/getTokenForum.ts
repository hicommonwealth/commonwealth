import type { Request, Response } from 'express';
import { Op } from 'sequelize';
import type { DB } from '../models';
import { factory, formatFilename } from 'common-common/src/logging';

const log = factory.getLogger(formatFilename(__filename));

// TODO: deprecate this by fetching token info on client side vs from DB tokens
const getTokenForum = async (models: DB, req: Request, res: Response) => {
  const address = req.query.address;
  if (!address) {
    return res.json({
      status: 'Failure',
      message: 'Must provide token address',
    });
  }

  // default to mainnet
  const chain_id = +req.query.chain_id || 1;
  const token = await models.Token.findOne({
    where: {
      address: { [Op.iLike]: address },
      chain_id,
    },
  });
  const node = await models.ChainNode.scope('withPrivateData').findOne({
    where: { eth_chain_id: chain_id },
  });
  let url = node?.url;
  if (!url) {
    url = req.query.url;
    if (!url) {
      return res.json({ status: 'Failure', message: 'Unsupported chain' });
    }
  }

  try {
    const Web3 = (await import('web3')).default;
    const node_url = node?.private_url || url;
    const provider =
      node_url.slice(0, 4) == 'http'
        ? new Web3.providers.HttpProvider(node_url)
        : new Web3.providers.WebsocketProvider(node_url);

    const web3 = new Web3(provider);
    const code = await web3.eth.getCode(address);
    if (provider instanceof Web3.providers.WebsocketProvider)
      provider.disconnect(1000, 'finished');
    if (code === '0x') {
      // Account returns 0x, Smart contract returns bytecode
      return res.json({
        status: 'Failure',
        message: 'Must provide valid contract address',
      });
    }
    return res.json({
      status: 'Success',
      token: token ? token.toJSON() : {},
    });
  } catch (e) {
    log.error(e.message);
    return res.json({
      status: 'Failure',
      message: 'Failed to find or create chain',
    });
  }
};

export default getTokenForum;
