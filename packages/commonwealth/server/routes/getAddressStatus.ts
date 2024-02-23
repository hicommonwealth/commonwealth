import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import type { NextFunction, Request, Response } from 'express';
import Sequelize from 'sequelize';

const Op = Sequelize.Op;

export const Errors = {
  NeedAddress: 'Must provide address',
  NeedCommunity: 'Must provide community',
  InvalidCommunity: 'Invalid community',
};

const getAddressStatus = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.body.address) {
    return next(new AppError(Errors.NeedAddress));
  }
  if (!req.body.community_id) {
    return next(new AppError(Errors.NeedCommunity));
  }

  const community = await models.Community.findOne({
    where: { id: req.body.community_id },
  });
  if (!community) {
    return next(new AppError(Errors.InvalidCommunity));
  }

  const existingAddress = await models.Address.findOne({
    where: {
      community_id: req.body.community_id,
      address: req.body.address,
      verified: { [Op.ne]: null },
    },
  });

  let result;
  if (existingAddress) {
    const belongsToUser = req.user && existingAddress.user_id === req.user.id;
    result = {
      exists: true,
      belongsToUser,
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
