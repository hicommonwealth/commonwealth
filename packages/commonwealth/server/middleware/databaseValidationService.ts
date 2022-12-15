import { AppError } from 'common-common/src/errors';
import { Request, Response, NextFunction } from 'express';
import { DB } from '../models';
import lookupAddressIsOwnedByUser from './lookupAddressIsOwnedByUser';

export const Errors = {
  InvalidUser: 'Invalid user',
};

export default class DatabaseValidationService {
  private models: DB;

  constructor(models: DB) {
    this.models = models;
  }

  public validateAuthor = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const [author, authorError] = await lookupAddressIsOwnedByUser(this.models, req);
    if (!author) return next(new AppError(Errors.InvalidUser));
    if (authorError) return next(new AppError(authorError));
    // If the author is valid, add it to the request object
    req.address = author;
    next();
  }
}
