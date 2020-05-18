import { successResponse } from '../util/apiHelpers';
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

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

    return next(new Error('Username or password is incorrect'));
  } else return next(new Error('Missing field: lookupKey'));
};
