import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NotAdmin: 'Must be admin',
  NeedParams: 'Must provide chain id and url',
  ChainNotFound: 'Chain not found',
  NodeNotFound: 'Node not found',
};

const deleteChainNode = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.user.isAdmin) {
    return next(new Error(Errors.NotAdmin));
  }
  if (!req.body.id || !req.body.node_url) {
    return next(new Error(Errors.NeedParams));
  }

  const chain = await models.Chain.findOne({ where: {
    id: req.body.id
  } });
  if (!chain) {
    return next(new Error(Errors.ChainNotFound));
  }
  const node = await models.ChainNode.findOne({
    chain: chain.id,
    url: req.body.node_url,
  });
  if (!node) {
    return next(new Error(Errors.NodeNotFound));
  }

  await node.destroy();

  return res.json({ status: 'Success', result: 'Deleted node' });
};

export default deleteChainNode;
