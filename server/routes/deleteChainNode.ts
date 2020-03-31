import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

const deleteChainNode = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!req.user.isAdmin) {
    return next(new Error('Must be admin'));
  }
  if (!req.body.id || !req.body.node_url) {
    return next(new Error('Must provide chain id and url'));
  }

  const chain = await models.Chain.findOne({ where: {
    id: req.body.id
  } });
  if (!chain) {
    return next(new Error('Chain not found'));
  }
  const node = await models.ChainNode.findOne({
    chain: chain.id,
    url: req.body.node_url,
  });
  if (!node) {
    return next(new Error('Node not found'));
  }

  await node.destroy();

  return res.json({ status: 'Success', result: 'Deleted node' });
};

export default deleteChainNode;
