import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { Errors as AddressErrors } from './createAddress';
const log = factory.getLogger(formatFilename(__filename));

const getChainStake = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.query.chain) {
    return next(new Error(AddressErrors.NeedChain));
  }
  const chain = await models.Chain.findOne({
    where: { id: req.query.chain }
  });
  if (!chain) {
    return next(new Error(AddressErrors.InvalidChain));
  }
  console.log('req.query.chain');
  console.log(req.query.chain);
  console.log(req.user.id);
  const list = await models.ChainStake.findAll({
    where: {
      user_id: req.user.id,
      chain: req.query.chain
    }
  });
  return res.json({ status: 'Success', data: list });
};

export default getChainStake;
