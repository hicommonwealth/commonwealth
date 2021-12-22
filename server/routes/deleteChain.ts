import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NotAdmin: 'Must be admin',
  NeedChainId: 'Must provide chain id',
  NoChain: 'Chain not found',
  CannotDeleteChain: 'Cannot delete a chain with registered addresses',
  NotAcceptableAdmin: 'Not an Acceptable Admin'
};

const deleteChain = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.user.isAdmin) {
    return next(new Error(Errors.NotAdmin));
  }
  if (!req.body.id) {
    return next(new Error(Errors.NeedChainId));
  }
  if (!['george@commonwealth.im', 'zak@commonwealth.im', 'jake@commonwealth.im'].includes(req.user.email)) {
    return next(new Error(Errors.NotAcceptableAdmin));
  }

  const chain = await models.Chain.findOne({
    where: {
      id: req.body.id,
    },
    include: [
      { model: models.OffchainTopic, required: false, },
      { model: models.OffchainThread, required: false, },
      { model: models.StarredCommunity, required: false, },
      { model: models.ChainNode, required: false, },
      { model: models.Address, required: false, },
    ]
  });
  if (!chain) {
    return next(new Error(Errors.NoChain));
  }

  // get addresses
  // get topics
  // get comments
  // get reactions
  // get roles

  // make sure no addresses are associated
  const hasAddresses = await chain.getAddresses();
  if (hasAddresses && hasAddresses.length) {
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
