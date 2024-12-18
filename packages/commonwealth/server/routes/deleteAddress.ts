import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import { decrementProfileCount } from '@hicommonwealth/model';
import { WalletId } from '@hicommonwealth/shared';
import type { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';

export const Errors = {
  NotLoggedIn: 'Not signed in',
  NeedAddress: 'Must provide address',
  NeedCommunity: 'Must provide community',
  AddressNotFound: 'Address not found',
  CannotDeleteMagic: 'Cannot delete Magic Link address',
  CannotDeleteOnlyAdmin:
    'Community must have at least 1 admin. Please assign another community member as admin, to leave this community.',
};

const deleteAddress = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { community } = req;

  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }
  if (!req.body.address) {
    return next(new AppError(Errors.NeedAddress));
  }
  if (!community) {
    return next(new AppError(Errors.NeedCommunity));
  }

  const addressObj = await models.Address.findOne({
    where: {
      community_id: community.id,
      address: req.body.address,
      user_id: req.user.id,
    },
  });
  if (!addressObj) {
    return next(new AppError(Errors.AddressNotFound));
  }
  if (addressObj.wallet_id === WalletId.Magic) {
    return next(new AppError(Errors.CannotDeleteMagic));
  }

  const adminUsers = await models.Address.findAll({
    where: {
      community_id: community.id,
      role: 'admin',
      user_id: { [Op.ne]: null },
    },
  });

  if (
    adminUsers.length === 1 &&
    adminUsers[0].dataValues.address === addressObj.address
  ) {
    return next(new AppError(Errors.CannotDeleteOnlyAdmin));
  }

  await models.sequelize.transaction(async (transaction) => {
    await models.Address.update(
      { user_id: null, verified: null },
      {
        where: {
          id: addressObj.id,
        },
        transaction,
      },
    );
    await decrementProfileCount(community.id!, req!.user!.id!, transaction);
  });

  return res.json({ status: 'Success', response: 'Deleted address' });
};

export default deleteAddress;
