import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { Errors as AddressErrors } from './createAddress';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  Author: 'Must provide author'
};

const createChainStake = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.body.author) {
    return next(new Error(Errors.Author));
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

  try {
    const newObj = await models.ChainStake.create({
      author: req.body.author,
      chain: req.body.chain,
      user_id: req.user.id
    });
    return res.json({ status: 'Success', result: newObj.toJSON() });
  } catch (e) {
    return next(e);
  }
};

export default createChainStake;
