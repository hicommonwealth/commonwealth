import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { Errors as AddressErrors } from './createAddress';
const log = factory.getLogger(formatFilename(__filename));

const getValidatorGroup = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.query.chain) {
    return next(new Error(AddressErrors.NeedChain));
  }
  const chain = await models.Chain.findOne({
    where: { id: req.query.chain }
  });

  if (!chain) {
    return next(new Error(AddressErrors.InvalidChain));
  }

  const list = await models.ValidatorGroup.findAll({
    where: { chain: req.query.chain, user_id: req.user.id },
    order: [
      ['created_at', 'ASC'],
    ],
  });

  return res.json({ status: 'Success', result: list || [] });
};

export default getValidatorGroup;
