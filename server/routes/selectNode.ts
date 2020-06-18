import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoUrl: 'Must provide node URL',
  NoChain: 'Must provide chain',
  NodeNF: 'Node not found',
};

const selectNode = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.body.url) {
    return next(new Error(Errors.NoUrl));
  }
  if (!req.body.chain) {
    return next(new Error(Errors.NoChain));
  }

  const node = await models.ChainNode.findOne({ where: { chain: req.body.chain, url: req.body.url } });
  if (!node) {
    return next(new Error(Errors.NodeNF));
  }
  req.user.setSelectedNode(node);
  await req.user.save();
  return res.json({ status: 'Success' });
};

export default selectNode;
