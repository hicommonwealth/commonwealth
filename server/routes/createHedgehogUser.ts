import { Response, NextFunction } from 'express';
import { successResponse } from '../util/apiHelpers';
import { redirectWithLoginError, redirectWithLoginSuccess } from './finishEmailLogin';
import { UserRequest } from '../types';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

export default async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const body = req.body;

  if (body.username && body.walletAddress) {
    const username = body.username.toLowerCase();
    const existingUser = await models.HedgehogUser.findOne({
      where: {
        username: username
      }
    });

    if (existingUser) {
      return next(new Error('Account already exists for user, try logging in'));
    }

    try {
      const hedgehogObj = await models.HedgehogUser.create({
        username: username,
        walletAddress: body.walletAddress
      });

      return res.json({ status: 'Success', result: hedgehogObj.toJSON() });
    } catch (err) {
      log.error('Error signing up a user', err);
      return next(new Error('Error signing up a user'));
    }
  } else return next(new Error('Missing one of the required fields: username, walletAddress'));
};
