import { AppError } from 'common-common/src/errors';
import { NextFunction } from 'express';
import { DB } from '../models';
import lookupAddressIsOwnedByUser from './lookupAddressIsOwnedByUser';

export const Errors = {
  InvalidUser: 'Invalid user',
};

export default class DatabaseValidationService {
  static async validateAuthor(
    models: DB,
    req: Express.Request,
    res: Express.Response,
    next: NextFunction
  ) {
    const [author, authorError] = await lookupAddressIsOwnedByUser(models, req);
    if (!author) return next(new AppError(Errors.InvalidUser));
    if (authorError) return next(new AppError(authorError));
    // If the author is valid, add it to the request object
    req.address = author;
    next();
  }
}
