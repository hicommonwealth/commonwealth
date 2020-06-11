import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const Op = Sequelize.Op;
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  MustBeAdmin: 'Must be admin',
  MissingParams: 'Must provide chain id, name, symbol, network, and node url',
  NodeExists: 'Node already exists',
  MustSpecifyContract: 'This is a contract, you must specify a contract address',
};

const addChainNode = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.user.isAdmin) {
    return next(new Error(Errors.MustBeAdmin));
  }
  if (!req.body.id || !req.body.name || !req.body.symbol || !req.body.network || !req.body.node_url) {
    return next(new Error(Errors.MissingParams));
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
      return next(new Error(Errors.NodeExists));
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
    return next(new Error(Errors.MustSpecifyContract));
  }

  const node = await models.ChainNode.create({
    chain: chain.id,
    url: req.body.node_url,
    address: (req.body.address) ? req.body.address : '',
  });

  return res.json({ status: 'Success', result: node.toJSON() });
};

export default addChainNode;
