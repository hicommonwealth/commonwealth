import { Request, Response, NextFunction } from 'express';
import { successResponse } from '../util/apiHelpers';
import { redirectWithLoginError, redirectWithLoginSuccess } from './finishEmailLogin';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  AccountExists: 'Account already exists for user, try logging in',
  SignUpError: 'Error signing up a user',
  MissingField: 'Missing one of the required fields: username, walletAddress',
};

export default async (models, req: Request, res: Response, next: NextFunction) => {
  const body = req.body;

  if (body.username && body.walletAddress) {
    const username = body.username.toLowerCase();
    const existingUser = await models.HedgehogUser.findOne({
      where: {
        username,
      }
    });

    if (existingUser) {
      return next(new Error(Errors.AccountExists));
    }

    try {
      const hedgehogObj = await models.HedgehogUser.create({
        username,
        walletAddress: body.walletAddress
      });

      return res.json({ status: 'Success', result: hedgehogObj.toJSON() });
    } catch (err) {
      log.error(Errors.SignUpError, err);
      return next(new Error(Errors.SignUpError));
    }
  } else return next(new Error(Errors.MissingField));
};
