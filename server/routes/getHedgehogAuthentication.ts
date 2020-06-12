import { successResponse } from '../util/apiHelpers';
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  IncorrectLogin: 'Username or password is incorrect',
  NoKey: 'Missing field: lookupKey',
};

export default async (models, req: Request, res: Response, next: NextFunction) => {
  if (req.query && req.query.lookupKey) {
    const existingAuth = await models.HedgehogAuthentication.findOne({
      where: {
        lookupKey: req.query.lookupKey
      }
    });

    if (existingAuth) {
      const r = successResponse(existingAuth);
      res.status(r.statusCode).send(r.object);
    }

    return next(new Error(Errors.IncorrectLogin));
  } else return next(new Error(Errors.NoKey));
};
