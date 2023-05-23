import { ChainBase, ChainNetwork, ChainType } from 'common-common/src/types';
import type { Request, Response } from 'express';
import { Op } from 'sequelize';
import type { DB } from '../models';
import { createDefaultCommunityRoles } from '../util/roles';
import { factory, formatFilename } from 'common-common/src/logging';

const log = factory.getLogger(formatFilename(__filename));

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
  // default to ERC20
  const chain_network = req.query.chain_network
    ? req.query.chain_network
    : ChainNetwork.ERC20;
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

  if (!token && !req.query.allowUncached) {
    return res.json({ status: 'Failure', message: 'Token does not exist' });
  }

  try {
    const Web3 = (await import('web3')).default;
    //IANHERE
    const node_url = node?.private_url || url;
    const provider =
      node_url.slice(0, 4) == 'http'
        ? new Web3.providers.HttpProvider(node_url)
        : new Web3.providers.WebsocketProvider(node_url);

    const web3 = new Web3(provider);
    const code = await web3.eth.getCode(address);
    if (provider.connected) provider.disconnect(1000, 'finished');
    if (code === '0x') {
      // Account returns 0x, Smart contract returns bytecode
      return res.json({
        status: 'Failure',
        message: 'Must provide valid contract address',
      });
    }
    if (req.query.autocreate) {
      if (!node) {
        return res.json({
          status: 'Failure',
          message: 'Cannot autocreate custom node',
        });
      }
      const [chain, success] = await models.Chain.findOrCreate({
        where: { id: token.id },
        defaults: {
          active: true,
          network: chain_network,
          type: ChainType.Token,
          icon_url: token.icon_url,
          default_symbol: token.symbol,
          name: token.name,
          base: ChainBase.Ethereum,
          has_chain_events_listener: false,
        },
      });

      // Create default roles if chain created successfully
      if (success) {
        await createDefaultCommunityRoles(models, chain.id);
      }

      // Create Contract + Association
      const [contract] = await models.Contract.findOrCreate({
        where: {
          address,
          chain_node_id: node.id,
        },
        defaults: {
          address,
          chain_node_id: node.id,
          decimals: token.decimals,
          symbol: token.symbol,
          type: chain.network, // TODO: Make better query param and validation for this
        },
      });
      await models.CommunityContract.create({
        chain_id: chain.id,
        contract_id: contract.id,
      });
      chain.Contract = contract.toJSON();

      const nodeJSON = node.toJSON();
      delete nodeJSON.private_url;
      return res.json({
        status: 'Success',
        result: { chain: chain.toJSON(), node: nodeJSON },
      });
    } else {
      // only return token data if we do not autocreate
      return res.json({
        status: 'Success',
        token: token ? token.toJSON() : {},
      });
    }
  } catch (e) {
    log.error(e.message);
    return res.json({
      status: 'Failure',
      message: 'Failed to find or create chain',
    });
  }
};

export default getTokenForum;
