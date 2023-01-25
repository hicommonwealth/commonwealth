import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../models';
import { Action } from 'commonwealth/shared/permissions';
import { isAddressPermitted } from '../util/roles';

export const Errors = {
  NeedChainId: 'Must provide a chain id to fetch',
  NeedAuthor: 'Must provide an author to fetch',
  InvalidBody: 'Invalid Request Body',
  InvalidAction: 'Invalid Action sent in the request body',
  InvalidActionNumber:
    'The Action number provided does not match the Action enum',
};

export const getPermissions = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.body) {
      throw new AppError(Errors.InvalidBody);
    }

    const { action, chain, author } = req.body;
    if (!action) {
      throw new AppError(Errors.InvalidAction);
    }

    if (!chain) {
      throw new AppError(Errors.NeedChainId);
    }

    if (!author) {
      throw new AppError(Errors.NeedAuthor);
    }

    if (!Object.values(Action).includes(action)) {
      throw new AppError(Errors.InvalidActionNumber);
    }

    const hasPermission = await isAddressPermitted(
      models,
      author.id,
      chain.id,
      action
    );
    if (!hasPermission) {
      return res.status(405).json({ status: 'Success', result: false });
    }

    return res.json({ status: 'Success', result: true });
  } catch (err) {
    return next(new AppError(err));
  }
};
