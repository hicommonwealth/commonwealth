import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { DB } from '../models';
import { AppError, ServerError } from 'common-common/src/errors';

const Op = Sequelize.Op;

export const Errors = {
  NeedAddress: 'Must provide address',
  NeedChain: 'Must provide chain',
  InvalidChain: 'Invalid chain',
};

const getAddressStatus = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  if (!req.body.address) {
    return next(new AppError(Errors.NeedAddress));
  }
  if (!req.body.chain) {
    return next(new AppError(Errors.NeedChain));
  }

  const chain = await models.Chain.findOne({
    where: { id: req.body.chain }
  });
  if (!chain) {
    return next(new AppError(Errors.InvalidChain));
  }

  const existingAddress = await models.Address.findOne({
    where: { chain: req.body.chain, address: req.body.address, verified: { [Op.ne]: null } }
  });

  let result;
  if (existingAddress) {
    const belongsToUser = req.user && (existingAddress.user_id === req.user.id);
    result = {
      exists: true,
      belongsToUser
    };
  } else {
    result = {
      exists: false,
      belongsToUser: false,
    };
  }

  return res.json({ status: 'Success', result });
};

export default getAddressStatus;
