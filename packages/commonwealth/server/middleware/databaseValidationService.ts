import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import { CommunityInstance } from '@hicommonwealth/model';
import type { NextFunction, Request, Response } from 'express';
import lookupAddressIsOwnedByUser from './lookupAddressIsOwnedByUser';
import { validateCommunity } from './validateCommunity';

export const ALL_COMMUNITIES = 'all_communities';

export const Errors = {
  InvalidUser: 'Invalid user',
  InvalidCommunity: 'Invalid community',
};

export default class DatabaseValidationService {
  private models: DB;

  constructor(models: DB) {
    this.models = models;
  }

  private async validateCommunityByRequestMethod(
    req: Request,
    validator: (
      models: DB,
      query: any,
    ) => Promise<[CommunityInstance, string, boolean]>,
  ) {
    let community: CommunityInstance | null = null;
    let error: any = null;
    let bypass: boolean = false;

    if (
      req.method === 'GET' ||
      req.method === 'POST' ||
      req.method === 'PUT' ||
      req.method === 'DELETE' ||
      req.method === 'PATCH'
    ) {
      const source = req.method === 'GET' ? req.query : req.body;
      [community, error, bypass] = await validator(this.models, source);
    }

    return [community, error, bypass];
  }

  public validateAuthor = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const [author, authorError] = await lookupAddressIsOwnedByUser(
      this.models,
      req,
    );

    if (authorError) return next(new AppError(authorError));

    if (!author) {
      return next(new AppError(Errors.InvalidUser));
    }

    // If the author is valid, add it to the request object
    req.address = author;
    next();
  };

  public validateCommunity = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const [community, error, bypass] =
      await this.validateCommunityByRequestMethod(req, validateCommunity);
    if (bypass) {
      next();
      return;
    }
    if (error) return next(new AppError(error));
    if (!community) return next(new AppError(Errors.InvalidCommunity));
    // If the community is valid, add it to the request object
    req.chain = community;
    req.community = community;
    next();
  };
}
