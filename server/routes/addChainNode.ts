import Sequelize from 'sequelize';
const Op = Sequelize.Op;
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

const addChainNode = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!req.user.isAdmin) {
    return next(new Error('Must be admin'));
  }
  if (!req.body.id || !req.body.name || !req.body.symbol || !req.body.network || !req.body.node_url) {
    return next(new Error('Must provide chain id, name, symbol, network, and node url'));
  }

  let chain = await models.Chain.findOne({ where: {
    // TODO: should we only check id?
    [Op.or]: [
      { id: req.body.id },
      { name: req.body.name }
    ]
  } });
  if (chain) {
    const existingNode = await models.ChainNode.find({ where: {
      chain: chain.id,
      url: req.body.node_url,
    } });
    if (existingNode) {
      return next(new Error('Node already exists'));
    }
  } else {
    chain = await models.Chain.create({
      id: req.body.id,
      name: req.body.name,
      symbol: req.body.symbol,
      network: req.body.network,
      icon_url: req.body.icon_url,
      active: true,
    });
  }

  if (chain.type === 'dao' && !req.body.address) {
    return next(new Error('This is a contract, you must specify a contract address'));
  }

  const node = await models.ChainNode.create({
    chain: chain.id,
    url: req.body.node_url,
    address: (req.body.address) ? req.body.address : '',
  });

  return res.json({ status: 'Success', result: node.toJSON() });
};

export default addChainNode;
