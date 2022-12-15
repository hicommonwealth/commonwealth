import { AppError } from 'common-common/src/errors';
import { Request, Response, NextFunction } from 'express';
import { DB } from '../models';
import lookupAddressIsOwnedByUser from './lookupAddressIsOwnedByUser';
import validateChain from './validateChain';

export const Errors = {
  InvalidUser: 'Invalid user',
};

export default class DatabaseValidationService {
  private models: DB;

  constructor(models: DB) {
    this.models = models;
  }

  public async validateAuthor(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const [author, authorError] = await lookupAddressIsOwnedByUser(this.models, req);
    if (!author) return next(new AppError(Errors.InvalidUser));
    if (authorError) return next(new AppError(authorError));
    // If the author is valid, add it to the request object
    req.address = author;
    next();
  }

  static async validateChain(
    models: DB,
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const [chain, error] = await validateChain(models, req.query);
    if (error) return next(new AppError(error));

    // If the chain is valid, add it to the request object
    req.chain = chain;
    next();
  }
}
