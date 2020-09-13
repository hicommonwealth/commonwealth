import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));
import { Errors as AddressErrors } from './createAddress';

export const Errors = {
  Stashes: 'Must provide stashes',
  Name: 'Must provide name',
  NameExists: 'Name already exists'
};

const STASHES_KEY = 'stashes[]';

const createValidatorGroup = async (models, req: Request, res: Response, next: NextFunction) => {
  const stashes = typeof req.body[STASHES_KEY] === 'object'
    ? req.body[STASHES_KEY]
    : [req.body[STASHES_KEY]];

  if (!req.body[STASHES_KEY] || !stashes.length) {
    return next(new Error(Errors.Stashes));
  }
  if (!req.body.name) {
    return next(new Error(Errors.Name));
  }
  if (!req.body.chain) {
    return next(new Error(AddressErrors.NeedChain));
  }

  const query = {
    name: req.body.name,
    chain: req.body.chain,
    user_id: req.user.id
  };

  const groups = await models.ValidatorGroup.findOne({
    where: query
  });

  if (groups)
    return next(new Error(Errors.NameExists));

  const insertObj = { stashes, ...query };
  try {
    const newObj = await models.ValidatorGroup.create(insertObj);
    return res.json({ status: 'Success', result: newObj.toJSON() });
  } catch (e) {
    return next(e);
  }
};

export default createValidatorGroup;
