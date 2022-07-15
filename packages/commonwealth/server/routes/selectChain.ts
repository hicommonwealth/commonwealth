import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoChain: 'Must provide chain',
  ChainNF: 'Chain not found',
};

const selectChain = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.body.chain) {
    return next(new Error(Errors.NoChain));
  }

  const chain = await models.Chain.findOne({ where: { id: req.body.chain } });
  if (!chain) {
    return next(new Error(Errors.ChainNF));
  }
  req.user.setSelectedChain(chain);
  await req.user.save();
  return res.json({ status: 'Success' });
};

export default selectChain;
