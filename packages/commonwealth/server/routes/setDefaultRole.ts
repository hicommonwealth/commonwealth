import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import { addressSwapper, ChainBase } from '@hicommonwealth/shared';
import type { NextFunction, Response } from 'express';
import Sequelize from 'sequelize';

export const Errors = {
  NotLoggedIn: 'Not signed in',
  InvalidAddress: 'Invalid address',
  RoleDNE: 'Role does not exist',
};

const setDefaultRole = async (
  models: DB,
  req,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log('setDefaultRole', req.user);
    if (!req.user) return next(new AppError(Errors.NotLoggedIn));
    console.log('setDefaultRole 2');
    if (!req.body.address || !req.body.author_community_id) {
      console.log('setDefaultRole 3');
      return next(new AppError(Errors.InvalidAddress));
    }
    console.log('setDefaultRole 4');

    const authorCommunity = await models.Community.findOne({
      where: { id: req.body.author_community_id },
    });
    console.log('setDefaultRole 5');
    const encodedAddress =
      // @ts-expect-error StrictNullChecks
      authorCommunity.base === ChainBase.Substrate
        ? addressSwapper({
            address: req.body.address,
            // @ts-expect-error StrictNullChecks
            currentPrefix: authorCommunity.ss58_prefix,
          })
        : req.body.address;

    console.log('setDefaultRole 6');
    const validAddress = await models.Address.findOne({
      where: {
        address: encodedAddress,
        community_id: req.body.author_community_id,
        user_id: req.user.id,
        verified: { [Sequelize.Op.ne]: null },
      },
    });
    console.log('setDefaultRole 7');
    if (!validAddress) return next(new AppError(Errors.InvalidAddress));
    console.log('setDefaultRole 8');
    validAddress.last_active = new Date();
    validAddress.is_user_default = true;
    await validAddress.save();
    console.log('setDefaultRole 9');
    await models.Address.update(
      { is_user_default: false },
      {
        where: {
          address: { [Sequelize.Op.ne]: encodedAddress },
          community_id: req.body.author_community_id,
          user_id: req.user.id,
          verified: { [Sequelize.Op.ne]: null },
        },
      },
    );
    console.log('setDefaultRole 10');
    return res.json({ status: 'Success' });
  } catch (err) {
    console.log('setDefaultRole error', err);
    return res.json({ status: 'Error' });
  }
};

export default setDefaultRole;
