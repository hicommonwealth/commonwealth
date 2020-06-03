import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

const selectNode = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!req.body.url) {
    return next(new Error('Must provide url'));
  }
  if (!req.body.chain) {
    return next(new Error('Must provide chain'));
  }

  const node = await models.ChainNode.findOne({ where: { chain: req.body.chain, url: req.body.url } });
  if (!node) {
    return next(new Error('Node not found'));
  }
  req.user.setSelectedNode(node);
  await req.user.save();
  return res.json({ status: 'Success' });
};

export default selectNode;
