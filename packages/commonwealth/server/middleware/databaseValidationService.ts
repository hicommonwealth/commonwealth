import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../models';
import lookupAddressIsOwnedByUser from './lookupAddressIsOwnedByUser';
import validateChain from './validateChain';

export const ALL_CHAINS = 'all_chains';

export const Errors = {
  InvalidUser: 'Invalid user',
  InvalidCommunity: 'Invalid community or chain',
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
    const [author, authorError] = await lookupAddressIsOwnedByUser(
      this.models,
      req
    );
    if (!author) return next(new AppError(Errors.InvalidUser));
    if (authorError) return next(new AppError(authorError));
    // If the author is valid, add it to the request object
    req.address = author;
    next();
  };

  public validateChain = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    let chain = null;
    let error = null;
    if (req.query.chain === ALL_CHAINS) {
      // If chain is all, don't set anything on request object
      next();
      return;
    }
    if (req.method === 'GET') {
      [chain, error] = await validateChain(this.models, req.query);
      if (error) return next(new AppError(error));
      // If the chain is valid, add it to the request object
      req.chain = chain;
    } else if (
      req.method === 'POST' ||
      req.method === 'PUT' ||
      req.method === 'DELETE' ||
      req.method === 'PATCH'
    ) {
      [chain, error] = await validateChain(this.models, req.body);
      if (error) return next(new AppError(error));
      // If the chain is valid, add it to the request object
      req.chain = chain;
    }
    if (!chain) return next(new AppError(Errors.InvalidCommunity));
    next();
  };

}
