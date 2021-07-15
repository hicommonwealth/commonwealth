import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const Op = Sequelize.Op;
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  MustBeAdmin: 'Must be admin',
  MissingParams: 'Must provide chain ID, name, symbol, network, and node url',
  ChainNotFound: 'Could not find chain with the supplied ID',
  InvalidSnapshotName: 'Snapshot name must be in the form of *.eth',
};

const addChainNode = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.user.isAdmin) {
    return next(new Error(Errors.MustBeAdmin));
  }
  if (!req.body.chainId || !req.body.snapshot) {
    return next(new Error(Errors.MissingParams));
  }

  const chain = await models.Chain.findOne({ where: {
    id: req.body.chainId
  } });

  if (!(/^[a-z]+\.eth/).test(req.body.snapshot)) {
    return next(new Error(Errors.InvalidSnapshotName));
  }

  if (!chain) {
    return next(new Error(Errors.ChainNotFound));
  }

  await chain.update({ snapshot: req.body.snapshot });

  return res.json({ status: 'Success' });
};

export default addChainNode;
