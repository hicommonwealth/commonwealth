import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { factory, formatFilename } from '../../shared/logging';
import { urlHasValidHTTPPrefix } from '../../shared/utils';
import { DB } from '../database';
import { ChainBase } from '../../shared/types';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoChainId: 'Must provide chain ID',
  NotAdmin: 'Not an admin',
  NoChainFound: 'Chain not found',
};

const updateChainToMainnet = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  if (!req.user.isAdmin) return next(new Error(Errors.NotAdmin));
  if (!req.body.id) return next(new Error(Errors.NoChainId));

  const chain = await models.Chain.findOne({ where: { id: req.body.id } });
  if (!chain) return next(new Error(Errors.NoChainFound));

  chain.collapsed_on_homepage = false;

  await chain.save();

  return res.json({ status: 'Success' });
};

export default updateChainToMainnet;
