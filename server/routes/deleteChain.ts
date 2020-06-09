import { Request, Response, NextFunction } from 'express';
import deleteCommunity from "./deleteCommunity";
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

const deleteChain = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!req.user.isAdmin) {
    return next(new Error('Must be admin'));
  }
  if (!req.body.id) {
    return next(new Error('Must provide chain id'));
  }

  const chain = await models.Chain.findOne({ where: {
    id: req.body.id,
  } });
  if (!chain) {
    return next(new Error('Chain not found'));
  }

  // make sure no addresses are associated
  const hasAddresses = await chain.hasAddresses();
  if (hasAddresses) {
    return next(new Error('Cannot delete a chain with registered addresses'));
  }

  const chainTags = await chain.getTags();
  chain.removeTags(chainTags);

  // delete all nodes first
  const nodes = await chain.getChainNodes();
  await Promise.all(nodes.map((n) => n.destroy()));
  await chain.destroy();
  return res.json({ status: 'Success', result: 'Deleted chain' });
};

export default deleteChain;
