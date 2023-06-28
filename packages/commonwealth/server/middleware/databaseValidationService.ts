import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../models';
import lookupAddressIsOwnedByUser from './lookupAddressIsOwnedByUser';
import { validateChain, validateChainWithTopics } from './validateChain';
import { CW_BOT_KEY } from '../config';

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

  private async validateChainByRequestMethod(
    req: Request,
    validator: (models: DB, query: any) => Promise<[any, any]>
  ) {
    let chain = null;
    let error = null;
    if (req.query.chain === ALL_CHAINS) {
      // If chain is all, don't set anything on request object
      return [null, null];
    }

    if (
      req.method === 'GET' ||
      req.method === 'POST' ||
      req.method === 'PUT' ||
      req.method === 'DELETE' ||
      req.method === 'PATCH'
    ) {
      const source = req.method === 'GET' ? req.query : req.body;
      [chain, error] = await validator(this.models, source);
    }

    return [chain, error];
  }

  public validateBotUser = async (req: Request,
    res: Response,
    next: NextFunction) => {
      //1. Check for bot token 
      if(req.body.auth !== CW_BOT_KEY){
        return next(new AppError('Approved Bot Only Endpoint'))
      }
      //2. Get Bot User and inject
      const user = await this.models.User.findOne({
        where: {
          id: 93625 //TODO: Figure out what user to use
        }
      })
     req.user = user
     next()
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
    if (!author) {
      return next(new AppError(Errors.InvalidUser));
    }
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
    const [chain, error] = await this.validateChainByRequestMethod(
      req,
      validateChain
    );
    if (error) return next(new AppError(error));
    if (req.query.chain !== ALL_CHAINS && !chain)
      return next(new AppError(Errors.InvalidCommunity));
    // If the chain is valid, add it to the request object
    req.chain = chain;
    next();
  };

  public validateChainWithTopics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const [chain, error] = await this.validateChainByRequestMethod(
      req,
      validateChainWithTopics
    );
    if (error) return next(new AppError(error));
    if (!chain) return next(new AppError(Errors.InvalidCommunity));
    // If the chain is valid, add it to the request object
    req.chain = chain;
    next();
  };
}
