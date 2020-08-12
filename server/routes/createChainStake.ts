import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { Errors as AddressErrors } from './createAddress';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  Stash: 'Must provide stash'
};

const createChainStake = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.body.stash) {
    return next(new Error(Errors.Stash));
  }
  if (!req.body.chain) {
    return next(new Error(AddressErrors.NeedChain));
  }
  const chain = await models.Chain.findOne({
    where: { id: req.body.chain }
  });
  if (!chain) {
    return next(new Error(AddressErrors.InvalidChain));
  }
  const query = {
    stash: req.body.stash,
    chain: req.body.chain
  };

  const chainStake = await models.ChainStake.findOne({
    where: query
  });

  if (chainStake)
    return res.json({ status: 'Success', result: chainStake.toJSON() });

  try {
    const newObj = await models.ChainStake.create(query);
    return res.json({ status: 'Success', result: newObj.toJSON() });
  } catch (e) {
    return next(e);
  }
};

export default createChainStake;
