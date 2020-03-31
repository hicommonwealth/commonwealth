import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

const updateChain = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!req.user.isAdmin) {
    return next(new Error('Must be admin'));
  }
  if (!req.body.id) {
    return next(new Error('Must provide chain id'));
  }
  if (req.body.network) {
    return next(new Error('Cannot change chain network'));
  }

  const chain = await models.Chain.findOne({ where: {
    id: req.body.id
  } });
  if (!chain) {
    return next(new Error('Chain not found'));
  }

  if (req.body.name) {
    chain.setName(req.body.name);
  }
  if (req.body.symbol) {
    chain.setSymbol(req.body.symbol);
  }
  if (req.body.icon_url) {
    chain.setIconUrl(req.body.icon_url);
  }
  if (req.body.active !== undefined) {
    chain.setActive(req.body.active);
  }
  await chain.save();

  return res.json({ status: 'Success', result: chain.toJSON() });
};

export default updateChain;
