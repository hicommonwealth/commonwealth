import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NotAdmin: 'Must be admin',
  NeedChainId: 'Must provide chain id',
  NoChain: 'Chain not found',
  CannotDeleteChain: 'Cannot delete a chain with registered addresses',
};

const deleteChain = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.user.isAdmin) {
    return next(new Error(Errors.NotAdmin));
  }
  if (!req.body.id) {
    return next(new Error(Errors.NeedChainId));
  }

  const chain = await models.Chain.findOne({ where: {
    id: req.body.id,
  } });
  if (!chain) {
    return next(new Error(Errors.NoChain));
  }

  // make sure no addresses are associated
  const hasAddresses = await chain.hasAddresses();
  if (hasAddresses) {
    return next(new Error(Errors.CannotDeleteChain));
  }

  const chainTopics = await chain.getTopics();
  chain.removeTopics(chainTopics);

  // delete all nodes first
  const nodes = await chain.getChainNodes();
  await Promise.all(nodes.map((n) => n.destroy()));
  await chain.destroy();
  return res.json({ status: 'Success', result: 'Deleted chain' });
};

export default deleteChain;
